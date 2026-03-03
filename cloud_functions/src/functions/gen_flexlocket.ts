import { onCall, CallableRequest } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../config/firebase";
import {
  REGION,
  FLEXLOCKET_TIMEOUT_SECONDS,
  FLEXLOCKET_MEMORY,
  GLOW_FREE_DAILY_LIMIT,
  GLOW_CREDIT_COST,
  COLLECTIONS,
  STORAGE_PATHS,
} from "../config/constants";
import { checkAndDeductCredits, addCredits } from "../services/credits_service";
import { optimizePrompt, enhancePhoto, generateImage, ImagenConfig } from "../services/ai_service";
import {
  downloadImage,
  uploadImage,
  bufferToBase64,
} from "../services/storage_service";
import { requireStoragePath, optionalString } from "../utils/validators";
import { throwUnauthenticated, wrapError } from "../utils/errors";
import { logger } from "../utils/logger";

const LOG_CTX = { functionName: "genFlexLocket" };

// ── Enhancement Modes ─────────────────────────────────────────────────────
interface GlowModeConfig {
  basePrompt: string;
  guidanceScale: number;
  extraNegative?: string;
  context: string;
}

interface GlowFilterConfig {
  prompt: string;
  styleHint: string;
  guidanceScale?: number; // override mode default if set
}

const GLOW_MODES: Record<string, GlowModeConfig> = {
  real: {
    basePrompt:
      "Recreate this exact same photo with subtle, indistinguishable professional retouching. " +
      "Lightroom-level micro-adjustments only: even skin tone, reduce minor blemishes, " +
      "add gentle natural glow. The viewer must NOT be able to tell any editing was done.",
    guidanceScale: 3.5,
    extraNegative: "any visible editing, filter look, color shift, artificial lighting",
    context:
      "Real mode: indistinguishable from original. Think Lightroom micro-adjustments by a top portrait photographer. " +
      "The person's friends and family should not notice any AI editing.",
  },
  moment: {
    basePrompt:
      "Recreate this exact same photo with a spontaneous, atmospheric mood. " +
      "Same face/pose/composition, but shift the lighting to feel candid and atmospheric. " +
      "Think cinematic stills from an indie film — unposed, effortless beauty.",
    guidanceScale: 5.0,
    context:
      "Moment mode: candid atmosphere. Same person, different lighting mood. " +
      "Think golden hour documentary photography or rainy-day window light.",
  },
  locket: {
    basePrompt:
      "Recreate this exact same photo with an intimate, warm, personal selfie aesthetic. " +
      "Soft warm tones, gentle vignette, cozy close-up feel. " +
      "Like the best selfie captured on a Locket widget — personal and authentic.",
    guidanceScale: 4.0,
    context:
      "Locket mode: intimate, warm, personal. Selfie aesthetic from Locket app. " +
      "Warm tones, soft focus edges, cozy feel.",
  },
  face: {
    basePrompt:
      "Apply ONLY targeted facial retouching to this photo. " +
      "The scene, background, clothing, hair, and body must remain COMPLETELY untouched. " +
      "Only modify the specified facial feature while keeping everything else pixel-identical.",
    guidanceScale: 4.5,
    extraNegative: "scene changes, background changes, clothing changes, body modification, hair changes",
    context:
      "Face mode: targeted facial retouching ONLY. Scene untouched. " +
      "Think dermatologist-grade precision — fix one thing, touch nothing else.",
  },
  filters: {
    basePrompt:
      "Apply professional color grading to this exact same photo. " +
      "Same composition, same person, same scene — only the color palette and mood changes. " +
      "Think Instagram/VSCO professional preset by a color science expert.",
    guidanceScale: 5.0,
    context:
      "Filters mode: Instagram/VSCO named color grading presets. " +
      "Professional editor color science. The photo looks like it was shot with different film stock.",
  },
  semantic: {
    basePrompt:
      "Analyze the scene context of this photo and apply the most appropriate professional enhancement. " +
      "Identify what the photo is about (food, travel, portrait, landscape, etc.) and enhance accordingly. " +
      "Food should look appetizing, travel should look epic, portraits should look flattering.",
    guidanceScale: 4.5,
    context:
      "Semantic mode: AI reads scene context and applies contextual enhancement. " +
      "Smart enough to know food needs warm saturation while landscapes need clarity.",
  },
};

const GLOW_FILTERS: Record<string, GlowFilterConfig> = {
  // ── Real mode filters ──
  natural: {
    prompt: "Subtle natural retouching: even out skin tone, reduce minor blemishes, add gentle glow as if lit by soft window light.",
    styleHint: "photorealistic, natural window light, editorial portrait",
  },
  studio: {
    prompt: "Professional studio lighting feel: clean key light on face, soft fill, subtle rim light separation from background.",
    styleHint: "studio portrait, professional headshot, clean lighting",
  },
  outdoor: {
    prompt: "Beautiful outdoor natural light: open shade softness, slight warmth, natural background bokeh enhancement.",
    styleHint: "outdoor portrait, golden natural light, shallow depth of field",
  },
  night_out: {
    prompt: "Night-time portrait polish: clean up noise, warm ambient tones, subtle catch-lights in eyes, moody but clear.",
    styleHint: "night portrait, ambient city light, low-light photography",
  },

  // ── Moment mode filters ──
  candid: {
    prompt: "Candid street photography feel: spontaneous moment, natural grain, documentary-style lighting.",
    styleHint: "candid photography, street style, documentary",
  },
  golden_hour: {
    prompt: "Golden hour magic: warm amber backlight, lens flare hints, long shadows, honeyed skin tones.",
    styleHint: "golden hour, warm backlight, sunset portrait",
  },
  rainy_day: {
    prompt: "Rainy day mood: cool blue-grey tones, wet reflections, soft diffused light, melancholic beauty.",
    styleHint: "rainy day, moody atmosphere, cool tones, wet streets",
  },
  cozy: {
    prompt: "Cozy indoor warmth: soft lamp light, warm oranges and browns, bokeh fairy lights, hygge aesthetic.",
    styleHint: "cozy, warm indoor light, hygge, soft bokeh",
  },

  // ── Locket mode filters ──
  classic: {
    prompt: "Classic Locket selfie: clean skin, warm undertones, soft front-facing light, genuine smile enhancement.",
    styleHint: "selfie, warm front light, Locket widget aesthetic",
  },
  vintage: {
    prompt: "Vintage photo feel: slightly faded blacks, warm color cast, subtle grain, nostalgic warmth like an old Polaroid.",
    styleHint: "vintage, Polaroid, nostalgic, faded film",
  },
  soft_glow: {
    prompt: "Soft ethereal glow: dreamy haze, pastel-shifted highlights, gentle skin smoothing, romantic Locket moment.",
    styleHint: "soft glow, dreamy, ethereal, pastel highlights",
  },

  // ── Face mode filters ──
  skin_smooth: {
    prompt: "Subtle skin smoothing ONLY: reduce visible pores and minor texture, keep freckles and moles. Skin should still look real, not plastic.",
    styleHint: "skin retouching, dermatologist-grade, natural texture",
  },
  eye_bright: {
    prompt: "Brighten eyes ONLY: enhance iris color, add subtle catch-light reflection, whiten sclera slightly. Eyes should sparkle naturally.",
    styleHint: "eye enhancement, bright eyes, natural sparkle",
  },
  teeth_white: {
    prompt: "Whiten teeth ONLY: remove yellow tint, even out tooth color. Must look natural, NOT blindingly white.",
    styleHint: "teeth whitening, natural dental, subtle",
  },
  full_face: {
    prompt: "Full face enhancement: combine subtle skin smoothing, eye brightening, and gentle teeth whitening. All subtle, all natural.",
    styleHint: "full face retouching, balanced, professional portrait",
  },

  // ── Filters mode ──
  paris: {
    prompt: "Paris preset: soft rose-pink undertones, desaturated greens, creamy highlights, French editorial elegance.",
    styleHint: "Paris, French editorial, rose tones, cream highlights",
  },
  tokyo: {
    prompt: "Tokyo preset: cool cyan shadows, neon-tinted highlights, crisp contrast, Japanese urban aesthetic.",
    styleHint: "Tokyo, neon, cyan shadows, urban Japanese",
  },
  la: {
    prompt: "LA preset: warm golden tones, lifted shadows, sun-kissed skin, California beach vibes.",
    styleHint: "LA, sun-kissed, golden, California lifestyle",
  },
  film: {
    prompt: "Analog film preset: Kodak Portra-style colors, soft grain, lifted blacks, warm midtones, nostalgic quality.",
    styleHint: "Kodak Portra, analog film, grain, warm midtones",
  },
  noir: {
    prompt: "Film noir preset: high contrast black and white conversion, deep shadows, dramatic highlights, classic cinema.",
    styleHint: "film noir, black and white, high contrast, dramatic",
    guidanceScale: 5.5,
  },
  candy: {
    prompt: "Candy preset: vibrant saturated colors, playful tones, pink-purple shifted shadows, fun and youthful energy.",
    styleHint: "candy, vibrant, saturated, playful colors",
  },

  // ── Semantic mode filters ──
  auto: {
    prompt: "Auto-detect scene and apply optimal enhancement. Portraits get skin retouching, food gets warm saturation, landscapes get clarity.",
    styleHint: "smart auto, scene-aware, context-dependent",
  },
  food_scene: {
    prompt: "Food photography enhancement: warm color temperature, increased saturation on reds/oranges, slight steam/freshness effect, appetizing look.",
    styleHint: "food photography, appetizing, warm saturation",
  },
  travel_scene: {
    prompt: "Travel photography enhancement: vibrant sky, enhanced horizon, dramatic clouds, rich landscape colors, epic vista feel.",
    styleHint: "travel photography, epic landscape, vibrant sky",
  },
};

interface GenFlexLocketInput {
  inputImagePath: string;
  enhanceMode?: string;
  filterId?: string;
  /** AI Agent custom prompt — when provided, skip mode/filter lookup */
  customPrompt?: string;
  /** @deprecated Use enhanceMode + filterId instead */
  vibeFilter?: string;
}

interface GenFlexLocketResult {
  enhancementId: string;
  status: string;
  outputImageUrl: string;
  creditsSpent: number;
  creditsRemaining: number;
}

/**
 * genFlexLocket — Subtle AI photo enhancement (FlexLocket / Glow).
 *
 * Philosophy: Real, authentic, beautiful — nobody can tell it's AI-enhanced.
 * Like having perfect lighting that day. Never reshape face, enlarge eyes,
 * edit body, or apply heavy makeup. Subtle & undetectable.
 *
 * Flow:
 *  1. Authenticate caller
 *  2. Validate input (inputImagePath, optional vibeFilter)
 *  3. Check daily free limit (glowUsedToday)
 *  4. If over free limit, check and deduct 0.5 credits
 *  5. Create enhancement doc (status: processing)
 *  6. Download user's input image
 *  7. Generate subtle enhancement prompt via Gemini
 *  8. Call Imagen with low guidance scale for subtle effect
 *  9. Upload enhanced image to Storage
 * 10. Update enhancement doc (status: completed)
 * 11. Increment glowUsedToday counter
 * 12. Return enhancementId, outputImageUrl, creditsSpent, creditsRemaining
 */
export const genFlexLocket = onCall(
  {
    region: REGION,
    timeoutSeconds: FLEXLOCKET_TIMEOUT_SECONDS,
    memory: FLEXLOCKET_MEMORY,
    maxInstances: 50,
  },
  async (request: CallableRequest<GenFlexLocketInput>): Promise<GenFlexLocketResult> => {
    const startTime = Date.now();

    // 1. Auth check
    if (!request.auth) {
      throwUnauthenticated();
    }
    const userId = request.auth.uid;

    let creditsRemaining: number | undefined;
    let creditCost = 0;
    let enhancementId: string | undefined;

    try {
      // 2. Validate input
      const inputImagePath = requireStoragePath(request.data.inputImagePath, "inputImagePath");

      // Resolve mode + filter (backward compat: vibeFilter → real mode)
      const rawMode = optionalString(request.data.enhanceMode, "enhanceMode");
      const rawFilter = optionalString(request.data.filterId, "filterId");
      const legacyVibe = optionalString(request.data.vibeFilter, "vibeFilter");
      const customPrompt = optionalString(request.data.customPrompt, "customPrompt");

      const isAgentMode = !!customPrompt;
      const enhanceMode = isAgentMode ? "agent" : (rawMode && GLOW_MODES[rawMode] ? rawMode : "real");
      const filterId = isAgentMode ? "custom" : (rawFilter && GLOW_FILTERS[rawFilter] ? rawFilter : (legacyVibe && GLOW_FILTERS[legacyVibe] ? legacyVibe : "natural"));

      logger.info(`Starting FlexLocket enhancement`, {
        ...LOG_CTX,
        userId,
        enhanceMode,
        filterId,
        isAgentMode,
      });

      const db = getDb();
      const userRef = db.collection(COLLECTIONS.USERS).doc(userId);

      // 3. Check daily free limit
      const userSnap = await userRef.get();
      const userData = userSnap.data();
      const glowUsedToday = (userData?.glowUsedToday as number) || 0;
      const today = new Date().toISOString().substring(0, 10);
      const lastReset = (userData?.glowLastResetDate as string) || "";

      // Reset counter if it's a new day
      const effectiveUsedToday = lastReset === today ? glowUsedToday : 0;
      const isFreeUse = effectiveUsedToday < GLOW_FREE_DAILY_LIMIT;

      // 4. If over free limit, deduct credits
      if (!isFreeUse) {
        creditCost = GLOW_CREDIT_COST;
        creditsRemaining = await checkAndDeductCredits(
          userId,
          creditCost,
          "spend_glow",
          "",
          `FlexLocket enhancement (daily use #${effectiveUsedToday + 1})`
        );
      } else {
        creditsRemaining = (userData?.creditsBalance as number) || 0;
      }

      // 5. Create enhancement doc
      const enhRef = db.collection(COLLECTIONS.ENHANCEMENTS).doc();
      enhancementId = enhRef.id;

      await enhRef.set({
        userId,
        inputImageUrl: inputImagePath,
        outputImageUrl: null,
        enhanceMode,
        filterId,
        status: "processing",
        progress: 10,
        errorMessage: null,
        enhancementTimeMs: null,
        creditsSpent: creditCost,
        isFreeUse,
        createdAt: FieldValue.serverTimestamp(),
        completedAt: null,
      });

      // 6. Download input image
      await enhRef.update({ progress: 20 });
      const inputImageBuffer = await downloadImage(inputImagePath);
      const inputImageBase64 = bufferToBase64(inputImageBuffer);

      // 7. Generate subtle enhancement prompt via Gemini (mode + filter OR customPrompt)
      await enhRef.update({ progress: 40 });

      let enhancementPrompt: string;
      let imagenConfig: ImagenConfig;

      const baseNegatives = [
        "deformed, ugly, distorted face, asymmetric face, crooked features",
        "heavy makeup, thick foundation, false eyelashes, dramatic eye shadow",
        "plastic surgery look, overly smooth skin, porcelain skin, airbrushed, wax figure",
        "enlarged eyes, reshapen nose, slimmed jaw, modified lips, face reshaping",
        "cartoon, anime, illustration, painting, digital art, 3D render, CGI",
        "overexposed, oversaturated, HDR, unnatural colors, neon glow",
        "different hairstyle, different clothing, different background, different pose",
        "body modification, slimming, enlarging, reshaping body",
      ];

      if (isAgentMode) {
        // AI Agent mode: creative transformation via Gemini native image gen.
        // The user chose a specific creative idea — let the prompt take full effect.
        enhancementPrompt = await optimizePrompt(
          customPrompt!,
          "photorealistic, high quality, professional photography, cinematic lighting",
          [
            "FlexLocket AI Agent — creative photo transformation.",
            "The user selected a creative idea to transform their photo.",
            "Apply the transformation BOLDLY — the user expects a visible, impressive change.",
            "Keep the person's face and identity recognizable, but everything else can change as needed.",
            "Think like a creative director: make it beautiful, striking, and share-worthy.",
          ].join(" ")
        );

        // Agent mode uses Gemini native image gen (not Imagen subject ref)
        // — better at following creative prompts while keeping face identity.
        imagenConfig = {
          aspectRatio: "1:1",
          negativePrompt: "deformed, ugly, distorted face, asymmetric face, cartoon, anime, illustration, 3D render",
        };
      } else {
        // Standard mode/filter path
        const modeConfig = GLOW_MODES[enhanceMode];
        const filterConfig = GLOW_FILTERS[filterId];

        enhancementPrompt = await optimizePrompt(
          [
            `${modeConfig.basePrompt} Specific filter: ${filterConfig.prompt}`,
            "CRITICAL RULES: Keep the EXACT same pose, angle, background, clothing, hairstyle, expression, and composition.",
            "Only apply professional-grade retouching like a skilled portrait photographer would in post-processing.",
            "Skin should look real and textured — NOT airbrushed, NOT plastic, NOT porcelain smooth.",
            "Keep all facial features EXACTLY the same — same nose, same eyes, same jaw, same lips. Zero reshaping.",
            "The person must look like themselves on their absolute best day with perfect professional lighting.",
            "If the original photo has natural imperfections (freckles, moles, natural skin texture), KEEP them.",
            "Think: professional Lightroom edit by a top portrait photographer, NOT AI filter.",
          ].join(" "),
          `${filterConfig.styleHint}, photorealistic, professional portrait retouching`,
          [
            `FlexLocket photo enhancement — ${enhanceMode} mode, ${filterId} filter.`,
            modeConfig.context,
            "The viewer should think 'wow they look great today' NOT 'that's clearly edited'.",
            "The person must be instantly recognizable — their own friends and family should not notice any AI editing.",
            "NEVER add makeup, change hair color, reshape any body part, or change the scene.",
          ].join(" ")
        );

        if (modeConfig.extraNegative) baseNegatives.push(modeConfig.extraNegative);

        imagenConfig = {
          guidanceScale: filterConfig.guidanceScale ?? modeConfig.guidanceScale,
          numberOfImages: 1,
          aspectRatio: "1:1",
          safetyFilterLevel: "BLOCK_MEDIUM_AND_ABOVE",
          negativePrompt: baseNegatives.join(", "),
        };
      }

      await enhRef.update({ progress: 50 });

      // 8. Generate image
      await enhRef.update({ progress: 60 });
      let outputBuffer: Buffer;

      if (isAgentMode) {
        // Agent mode: Gemini native image gen — creative transformation
        outputBuffer = await generateImage(
          enhancementPrompt,
          inputImageBase64,
          imagenConfig
        );
      } else {
        // Standard mode: Imagen subject reference — subtle enhancement
        outputBuffer = await enhancePhoto(
          inputImageBase64,
          enhancementPrompt,
          imagenConfig
        );
      }

      // 9. Upload enhanced image
      await enhRef.update({ progress: 80 });
      const outputPath = `${STORAGE_PATHS.GENERATIONS}/${userId}/${enhancementId}/glow_output.png`;
      const outputUrl = await uploadImage(outputBuffer, outputPath);

      // 10. Update enhancement doc
      const enhancementTimeMs = Date.now() - startTime;
      await enhRef.update({
        status: "completed",
        progress: 100,
        outputImageUrl: outputUrl,
        enhancementTimeMs,
        completedAt: FieldValue.serverTimestamp(),
      });

      // 11. Increment glowUsedToday
      await userRef.update({
        glowUsedToday: effectiveUsedToday + 1,
        glowLastResetDate: today,
        lastActiveAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(
        `FlexLocket completed in ${enhancementTimeMs}ms: ${enhancementId}`,
        { ...LOG_CTX, userId, enhancementId }
      );

      // 12. Return result
      return {
        enhancementId,
        status: "completed",
        outputImageUrl: outputUrl,
        creditsSpent: creditCost,
        creditsRemaining: creditsRemaining!,
      };
    } catch (error) {
      logger.error("FlexLocket enhancement failed", error, {
        ...LOG_CTX,
        userId,
      });

      // Refund credits if they were deducted (only for paid uses)
      if (creditCost > 0 && typeof creditsRemaining === "number") {
        try {
          await addCredits(
            userId,
            creditCost,
            "refund",
            enhancementId || null,
            `Refund - FlexLocket enhancement failed`
          );
          logger.info(`Refunded ${creditCost} credits for failed FlexLocket`, {
            ...LOG_CTX,
            userId,
          });
        } catch (refundError) {
          logger.error("Failed to refund credits for FlexLocket", refundError, {
            ...LOG_CTX,
            userId,
          });
        }
      }

      // Mark the enhancement doc as failed if it was created
      if (enhancementId) {
        try {
          const db = getDb();
          await db.collection(COLLECTIONS.ENHANCEMENTS).doc(enhancementId).update({
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            completedAt: FieldValue.serverTimestamp(),
          });
        } catch (_) {
          // Best effort
        }
      }

      throw wrapError(error);
    }
  }
);
