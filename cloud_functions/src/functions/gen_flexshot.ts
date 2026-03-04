import { onCall, CallableRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../config/firebase";
import {
  REGION,
  FLEXSHOT_TIMEOUT_SECONDS,
  FLEXSHOT_MEMORY,
  TEMPLATE_CREDIT_COST,
  PREMIUM_TEMPLATE_CREDIT_COST,
  COLLECTIONS,
  STORAGE_PATHS,
} from "../config/constants";
import { GenFlexShotInput, GenFlexShotResult } from "../models/generation";
import { checkAndDeductCredits, addCredits } from "../services/credits_service";
import { optimizePrompt, generateImage, ImagenConfig } from "../services/ai_service";
import {
  downloadImage,
  uploadImage,
  bufferToBase64,
} from "../services/storage_service";
import {
  requireString,
  requireStoragePath,
  optionalString,
} from "../utils/validators";
import {
  throwUnauthenticated,
  throwNotFound,
  wrapError,
} from "../utils/errors";

const geminiApiKeys = defineSecret("GEMINI_API_KEYS");
import { logger } from "../utils/logger";

const LOG_CTX = { functionName: "genFlexShot" };

/**
 * genFlexShot — Generate a single FlexShot image.
 *
 * Flow:
 *  1. Authenticate the caller
 *  2. Validate input (inputImagePath, templateId, optional style)
 *  3. Load template from Firestore
 *  4. Determine credit cost (standard vs premium)
 *  5. Check and deduct credits (atomic transaction)
 *  6. Create a generation doc (status: processing)
 *  7. Download the user's input image from Storage
 *  8. Optimize the template prompt via Gemini
 *  9. Call Imagen API with the optimized prompt + reference image
 * 10. Upload the result to Storage
 * 11. Update the generation doc (status: completed)
 * 12. Increment the user's totalGenerations counter
 * 13. Return generationId, status, creditsSpent, creditsRemaining
 */
export const genFlexShot = onCall(
  {
    region: REGION,
    timeoutSeconds: FLEXSHOT_TIMEOUT_SECONDS,
    memory: FLEXSHOT_MEMORY,
    maxInstances: 50,
    secrets: [geminiApiKeys],
  },
  async (request: CallableRequest<GenFlexShotInput>): Promise<GenFlexShotResult> => {
    const startTime = Date.now();

    // 1. Auth check
    if (!request.auth) {
      throwUnauthenticated();
    }
    const userId = request.auth.uid;

    let creditsRemaining: number | undefined;
    let creditCost: number | undefined;
    let generationId: string | undefined;

    try {
      // 2. Validate input
      const inputImagePath = requireStoragePath(request.data.inputImagePath, "inputImagePath");
      const templateId = requireString(request.data.templateId, "templateId");
      const style = optionalString(request.data.style, "style");

      logger.info(`Starting FlexShot generation`, {
        ...LOG_CTX,
        userId,
        templateId,
      });

      // 3. Load template
      const db = getDb();
      const templateSnap = await db
        .collection(COLLECTIONS.TEMPLATES)
        .doc(templateId)
        .get();

      if (!templateSnap.exists) {
        throwNotFound("Template", templateId);
      }

      const template = templateSnap.data()!;
      if (!template.isActive) {
        throwNotFound("Template", templateId);
      }

      // 4. Determine credit cost
      creditCost = template.isPremium
        ? PREMIUM_TEMPLATE_CREDIT_COST
        : TEMPLATE_CREDIT_COST;

      // 5. Check and deduct credits
      creditsRemaining = await checkAndDeductCredits(
        userId,
        creditCost,
        "spend_flexshot",
        "", // Will update with generationId after creation
        `FlexShot - ${template.name}`
      );

      // 6. Create generation doc
      const genRef = db.collection(COLLECTIONS.GENERATIONS).doc();
      generationId = genRef.id;

      await genRef.set({
        userId,
        templateId,
        inputImageUrl: inputImagePath,
        outputImageUrl: null,
        outputHdUrl: null,
        status: "processing",
        progress: 10,
        errorMessage: null,
        promptUsed: "",
        generationTimeMs: null,
        creditsSpent: creditCost,
        imagenMetadata: null,
        createdAt: FieldValue.serverTimestamp(),
        completedAt: null,
      });

      logger.info(`Generation doc created: ${generationId}`, {
        ...LOG_CTX,
        userId,
        generationId,
      });

      // 7. Download input image
      await genRef.update({ progress: 20 });
      const inputImageBuffer = await downloadImage(inputImagePath);
      const inputImageBase64 = bufferToBase64(inputImageBuffer);

      // 8. Optimize prompt via Gemini
      await genRef.update({ progress: 40 });
      // Replace {subject} placeholder — Imagen uses [1] reference for the person
      const basePrompt = (template.promptTemplate || "").replace(/\{subject\}/gi, "the person");
      const optimizedPrompt = await optimizePrompt(
        basePrompt,
        style || template.style || "realistic",
        `Template: ${template.name}, Category: ${template.category}`
      );

      await genRef.update({ promptUsed: optimizedPrompt, progress: 50 });

      // 9. Generate image via Imagen
      const imagenConfig: ImagenConfig = {
        numberOfImages: 1,
        aspectRatio: template.imagenParams?.aspectRatio || "1:1",
        negativePrompt: template.negativePrompt || undefined,
      };

      await genRef.update({ progress: 60 });
      const outputBuffer = await generateImage(
        optimizedPrompt,
        inputImageBase64,
        imagenConfig
      );

      // 10. Upload result to Storage
      await genRef.update({ progress: 80 });
      const outputPath = `${STORAGE_PATHS.GENERATIONS}/${userId}/${generationId}/output.png`;
      const outputUrl = await uploadImage(outputBuffer, outputPath);

      // 11. Mark generation as completed
      const generationTimeMs = Date.now() - startTime;
      await genRef.update({
        status: "completed",
        progress: 100,
        outputImageUrl: outputUrl,
        generationTimeMs,
        imagenMetadata: {
          model: "gemini-image",
        },
        completedAt: FieldValue.serverTimestamp(),
      });

      // 12. Increment user stats & template usage count
      await db
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .update({
          totalGenerations: FieldValue.increment(1),
          lastActiveAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

      await db
        .collection(COLLECTIONS.TEMPLATES)
        .doc(templateId)
        .update({
          usageCount: FieldValue.increment(1),
        });

      logger.info(
        `FlexShot completed in ${generationTimeMs}ms: ${generationId}`,
        { ...LOG_CTX, userId, generationId }
      );

      // 13. Return result
      return {
        generationId,
        status: "completed",
        creditsSpent: creditCost,
        creditsRemaining,
      };
    } catch (error) {
      logger.error("FlexShot generation failed", error, {
        ...LOG_CTX,
        userId,
      });

      // Refund credits if they were deducted (creditsRemaining is defined after deduction)
      if (typeof creditsRemaining === "number" && typeof creditCost === "number") {
        try {
          await addCredits(
            userId,
            creditCost,
            "refund",
            generationId || null,
            `Refund - FlexShot generation failed`
          );
          logger.info(`Refunded ${creditCost} credits for failed FlexShot`, {
            ...LOG_CTX,
            userId,
          });

          // Mark the generation doc as failed if it was created
          if (generationId) {
            const db = getDb();
            await db.collection(COLLECTIONS.GENERATIONS).doc(generationId).update({
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "Unknown error",
              completedAt: FieldValue.serverTimestamp(),
            });
          }
        } catch (refundError) {
          logger.error("Failed to refund credits for FlexShot", refundError, {
            ...LOG_CTX,
            userId,
          });
        }
      }

      throw wrapError(error);
    }
  }
);
