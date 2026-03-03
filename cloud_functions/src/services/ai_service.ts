import { getGenAIClient, getGeminiModel, getGeminiImageModel } from "../config/ai";
import {
  IMAGEN_MODEL,
  PROJECT_ID,
  VERTEX_AI_LOCATION,
} from "../config/constants";
import { logger } from "../utils/logger";
import { throwInternal } from "../utils/errors";

const LOG_CTX = { functionName: "ai_service" };

// ---------------------------------------------------------------------------
// Retry helper for rate-limited API calls (429 RESOURCE_EXHAUSTED)
// ---------------------------------------------------------------------------

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 8000; // 8s initial delay → 8s, 16s, 32s, 64s, 128s

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message || "";
    return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Resource exhausted");
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (isRateLimitError(error) && attempt < MAX_RETRIES) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt); // 5s, 10s, 20s
        logger.warn(
          `[${label}] Rate limited (429), retry ${attempt + 1}/${MAX_RETRIES} after ${delayMs}ms`,
          LOG_CTX
        );
        await sleep(delayMs);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export interface ImagenConfig {
  guidanceScale?: number;
  numberOfImages?: number;
  aspectRatio?: string;
  safetyFilterLevel?: string;
  negativePrompt?: string;
}

/**
 * Use Gemini to optimize a base prompt for Imagen image generation.
 *
 * Takes the raw template prompt and optional style hints, and returns
 * a detailed, optimized prompt that will produce better Imagen results.
 */
export async function optimizePrompt(
  basePrompt: string,
  styleHint: string,
  context?: string
): Promise<string> {
  const client = getGenAIClient();
  const model = getGeminiModel();

  const systemInstruction = [
    "You are an expert prompt engineer for AI image generation (Imagen 3 with subject reference).",
    "The generated image will use a reference photo of a person. The subject is referenced as [1] in the prompt.",
    "Given a base prompt, style hint, and optional context, produce an optimized prompt.",
    "The optimized prompt should:",
    "- Start with a scene/setting description (do NOT start with 'A photo of [1]' — that is added separately)",
    "- Remove any {subject} placeholder — describe the scene and setting instead",
    "- Be vivid and descriptive (lighting, camera angle, mood, setting details)",
    "- Maintain the original scene intent",
    "- Include photographic quality descriptors when style is realistic",
    "- Be a single paragraph, under 400 characters",
    "- Output ONLY the prompt text, no quotes, no explanation",
  ].join("\n");

  const userMessage = [
    `Base prompt: ${basePrompt}`,
    `Style: ${styleHint || "realistic"}`,
    context ? `Context: ${context}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await client.models.generateContent({
      model,
      contents: userMessage,
      config: {
        systemInstruction,
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    });

    const optimized = response.text?.trim();
    if (!optimized) {
      logger.warn("Gemini returned empty response, falling back to base prompt", LOG_CTX);
      return basePrompt;
    }

    logger.debug(`Prompt optimized: ${optimized.substring(0, 100)}...`, LOG_CTX);
    return optimized;
  } catch (error) {
    logger.error("Gemini prompt optimization failed", error, LOG_CTX);
    // Fall back to the original prompt instead of failing the whole generation
    return basePrompt;
  }
}

/**
 * Generate an image using Gemini native image generation.
 *
 * Uses Gemini 2.5 Flash Image model with generateContent API.
 * Pass reference image as inline data + text prompt.
 *
 * @returns Image buffer.
 */
export async function generateImage(
  prompt: string,
  referenceImageBase64: string,
  config: ImagenConfig = {}
): Promise<Buffer> {
  const { aspectRatio = "1:1", negativePrompt } = config;

  const client = getGenAIClient();
  const model = getGeminiImageModel();

  const finalPrompt = negativePrompt
    ? `${prompt}\n\nAvoid: ${negativePrompt}`
    : prompt;

  logger.info(`Gemini image prompt: ${finalPrompt.substring(0, 200)}`, LOG_CTX);

  return withRetry(async () => {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: referenceImageBase64 } },
              { text: `Generate an image of this person in the following scene. Keep the person's face and identity exactly the same.\n\n${finalPrompt}` },
            ],
          },
        ],
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
          },
        },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        logger.error("Gemini image returned no candidates", new Error("empty candidates"), LOG_CTX);
        throwInternal("Image generation returned no candidates — may have been filtered by safety.");
      }

      const parts = candidates[0].content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
            return Buffer.from(part.inlineData.data, "base64");
          }
        }
      }

      logger.error("Gemini image returned no image data in parts", new Error("no inlineData"), LOG_CTX);
      throwInternal("Image generation returned no image data.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("Image generation")) {
        throw error;
      }
      logger.error("Image generation unexpected error", error, LOG_CTX);
      throw error; // Re-throw for retry logic to catch 429s
    }
  }, "generateImage");
}

/**
 * Enhance a photo subtly using Imagen — FlexLocket "Glow" feature.
 *
 * Unlike FlexShot (which generates new images from templates),
 * FlexLocket enhances the original photo with subtle improvements:
 * better lighting, skin tone, color grading — while keeping the
 * subject exactly as they are. Nobody should tell it's AI-enhanced.
 *
 * Uses STYLE_REFERENCE (not SUBJECT_REFERENCE) with the same image
 * so Imagen applies subtle artistic enhancement without transforming the face.
 */
export async function enhancePhoto(
  inputImageBase64: string,
  enhancementPrompt: string,
  config: ImagenConfig = {}
): Promise<Buffer> {
  const {
    numberOfImages = 1,
    aspectRatio = "1:1",
    safetyFilterLevel = "BLOCK_MEDIUM_AND_ABOVE",
    negativePrompt,
  } = config;

  const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/${IMAGEN_MODEL}:predict`;

  const instances = [
    {
      prompt: `A photo of [1]. ${enhancementPrompt}`,
      ...(negativePrompt && { negativePrompt }),
      referenceImages: [
        {
          referenceImage: {
            bytesBase64Encoded: inputImageBase64,
          },
          referenceType: "REFERENCE_TYPE_SUBJECT",
          referenceId: 1,
          subjectImageConfig: {
            subjectType: "SUBJECT_TYPE_PERSON",
          },
        },
      ],
    },
  ];

  const parameters = {
    sampleCount: numberOfImages,
    aspectRatio,
    safetyFilterLevel,
    personGeneration: "allow_all",
  };

  return withRetry(async () => {
    try {
      const { GoogleAuth } = await import("google-auth-library");
      const auth = new GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      });
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ instances, parameters }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        // Check for rate limit in REST response
        if (response.status === 429) {
          throw new Error(`429 RESOURCE_EXHAUSTED: ${errorBody}`);
        }
        logger.error("Imagen enhance API error", new Error(errorBody), LOG_CTX);
        throwInternal(`Photo enhancement failed: ${response.status}`);
      }

      const result = await response.json() as Record<string, unknown>;

      logger.info(`Imagen enhance response keys: ${Object.keys(result).join(", ")}`, LOG_CTX);

      const predictions = result.predictions as Array<{ bytesBase64Encoded: string }> | undefined;
      if (!predictions || predictions.length === 0) {
        const debugResult = { ...result };
        delete debugResult.predictions;
        logger.error("Imagen enhance returned no predictions", new Error(JSON.stringify(debugResult).substring(0, 1000)), LOG_CTX);
        throwInternal("Photo enhancement returned no predictions — image may have been filtered by safety.");
      }

      return Buffer.from(predictions[0].bytesBase64Encoded, "base64");
    } catch (error) {
      if (error instanceof Error && error.message.includes("enhancement")) {
        throw error;
      }
      if (error instanceof Error && error.message.includes("no predictions")) {
        throw error;
      }
      logger.error("Photo enhancement unexpected error", error, LOG_CTX);
      throw error; // Re-throw for retry logic
    }
  }, "enhancePhoto");
}

/**
 * Generate an image with face/subject consistency for FlexTale story scenes.
 *
 * Uses Gemini native image generation. Passes the reference image (and optionally
 * the previous scene image) as inline data to maintain face/style consistency.
 */
export async function generateImageWithConsistency(
  prompt: string,
  referenceImageBase64: string,
  previousSceneImageBase64: string | null,
  config: ImagenConfig = {}
): Promise<Buffer> {
  const { aspectRatio = "9:16", negativePrompt } = config;

  const client = getGenAIClient();
  const model = getGeminiImageModel();

  const finalPrompt = negativePrompt
    ? `${prompt}\n\nAvoid: ${negativePrompt}`
    : prompt;

  // Build content parts: reference image + optional previous scene + text prompt
  const parts: Array<Record<string, unknown>> = [
    { inlineData: { mimeType: "image/jpeg", data: referenceImageBase64 } },
  ];

  let textInstruction = `Generate an image of this person in the following scene. Keep the person's face and identity exactly the same throughout all scenes.\n\n${finalPrompt}`;

  if (previousSceneImageBase64) {
    parts.push({ inlineData: { mimeType: "image/jpeg", data: previousSceneImageBase64 } });
    textInstruction = `The first image is the reference person. The second image is the previous scene — maintain visual style consistency with it.\n\nGenerate a new scene with the same person. Keep the person's face and identity exactly the same.\n\n${finalPrompt}`;
  }

  parts.push({ text: textInstruction });

  return withRetry(async () => {
    try {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
          },
        },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        logger.error("Gemini consistency returned no candidates", new Error("empty candidates"), LOG_CTX);
        throwInternal("Consistency generation returned no candidates — may have been filtered by safety.");
      }

      const responseParts = candidates[0].content?.parts;
      if (responseParts) {
        for (const part of responseParts) {
          if (part.inlineData?.data) {
            return Buffer.from(part.inlineData.data, "base64");
          }
        }
      }

      logger.error("Gemini consistency returned no image data in parts", new Error("no inlineData"), LOG_CTX);
      throwInternal("Consistency generation returned no image data.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("generation")) {
        throw error;
      }
      logger.error("Consistency image generation unexpected error", error, LOG_CTX);
      throw error; // Re-throw for retry logic to catch 429s
    }
  }, "generateImageWithConsistency");
}
