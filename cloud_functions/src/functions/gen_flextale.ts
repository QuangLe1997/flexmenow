import { onCall, CallableRequest } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../config/firebase";
import {
  REGION,
  FLEXTALE_TIMEOUT_SECONDS,
  FLEXTALE_MEMORY,
  FLEXTALE_BASE_CREDIT_COST,
  FLEXTALE_PER_SCENE_COST,
  COLLECTIONS,
  STORAGE_PATHS,
} from "../config/constants";
import { GenFlexTaleInput, GenFlexTaleResult, StoryPackScene } from "../models/story";
import { checkAndDeductCredits } from "../services/credits_service";
import {
  optimizePrompt,
  generateImageWithConsistency,
  ImagenConfig,
} from "../services/ai_service";
import {
  downloadImage,
  uploadImage,
  bufferToBase64,
} from "../services/storage_service";
import {
  requireString,
  requireStoragePath,
  optionalPositiveIntArray,
} from "../utils/validators";
import {
  throwUnauthenticated,
  throwNotFound,
  throwInternal,
  wrapError,
} from "../utils/errors";
import { logger } from "../utils/logger";

const LOG_CTX = { functionName: "genFlexTale" };

/**
 * genFlexTale — Generate a FlexTale story series with multiple scenes.
 *
 * Flow:
 *  1. Authenticate caller
 *  2. Validate input (inputImagePath, storyId/packId, selectedChapters)
 *  3. Load story pack + scenes from Firestore
 *  4. Filter scenes if selectedChapters provided
 *  5. Calculate total credit cost
 *  6. Check and deduct credits (atomic transaction)
 *  7. Create story doc + scene subdocs (status: processing)
 *  8. Download user's reference image
 *  9. For each scene SEQUENTIALLY:
 *     a. Optimize prompt via Gemini (include story context for continuity)
 *     b. Generate image via Imagen with subject consistency
 *        - Always use the original reference image for face/subject identity
 *        - Use previous scene as style reference for visual continuity
 *     c. Upload result to Storage
 *     d. Update scene subdoc (status: completed)
 *     e. Update story progress
 * 10. Mark story as completed
 * 11. Return storyId, status, creditsSpent, creditsRemaining
 *
 * KEY DESIGN: Face consistency is maintained by always passing the original
 * user photo as SUBJECT_REFERENCE. Visual scene continuity uses the previous
 * scene output as STYLE_REFERENCE.
 */
export const genFlexTale = onCall(
  {
    region: REGION,
    timeoutSeconds: FLEXTALE_TIMEOUT_SECONDS,
    memory: FLEXTALE_MEMORY,
    maxInstances: 20,
  },
  async (request: CallableRequest<GenFlexTaleInput>): Promise<GenFlexTaleResult> => {
    // 1. Auth check
    if (!request.auth) {
      throwUnauthenticated();
    }
    const userId = request.auth.uid;

    try {
      // 2. Validate input
      const inputImagePath = requireStoragePath(request.data.inputImagePath, "inputImagePath");
      const storyPackId = requireString(request.data.storyId, "storyId");
      const selectedChapters = optionalPositiveIntArray(
        request.data.selectedChapters,
        "selectedChapters"
      );

      logger.info(`Starting FlexTale generation`, {
        ...LOG_CTX,
        userId,
        storyId: storyPackId,
      });

      // 3. Load story pack
      const db = getDb();
      const packSnap = await db
        .collection(COLLECTIONS.STORY_PACKS)
        .doc(storyPackId)
        .get();

      if (!packSnap.exists) {
        throwNotFound("StoryPack", storyPackId);
      }

      const pack = packSnap.data()!;
      if (!pack.isActive) {
        throwNotFound("StoryPack", storyPackId);
      }

      // Load all scenes from subcollection, ordered by sceneOrder
      const scenesSnap = await db
        .collection(COLLECTIONS.STORY_PACKS)
        .doc(storyPackId)
        .collection("scenes")
        .orderBy("sceneOrder", "asc")
        .get();

      if (scenesSnap.empty) {
        throwInternal(`StoryPack '${storyPackId}' has no scenes.`);
      }

      let packScenes = scenesSnap.docs.map(
        (doc) => doc.data() as StoryPackScene
      );

      // 4. Filter scenes if selectedChapters provided
      if (selectedChapters && selectedChapters.length > 0) {
        packScenes = packScenes.filter((scene) =>
          selectedChapters.includes(scene.sceneOrder)
        );
        if (packScenes.length === 0) {
          throwInternal("No matching scenes found for selected chapters.");
        }
      }

      const totalScenes = packScenes.length;

      // 5. Calculate credit cost
      const creditCost = FLEXTALE_BASE_CREDIT_COST + totalScenes * FLEXTALE_PER_SCENE_COST;

      // 6. Deduct credits
      const creditsRemaining = await checkAndDeductCredits(
        userId,
        creditCost,
        "spend_flextale",
        storyPackId,
        `FlexTale - ${pack.name} (${totalScenes} scenes)`
      );

      // 7. Create story doc
      const storyRef = db.collection(COLLECTIONS.STORIES).doc();
      const storyId = storyRef.id;

      await storyRef.set({
        userId,
        storyPackId,
        storyPackName: pack.name,
        inputImageUrl: inputImagePath,
        status: "processing",
        totalScenes,
        completedScenes: 0,
        creditsSpent: creditCost,
        createdAt: FieldValue.serverTimestamp(),
        completedAt: null,
      });

      // Create scene subdocs
      const scenesCollection = storyRef.collection("scenes");
      for (const packScene of packScenes) {
        await scenesCollection.doc(`scene_${packScene.sceneOrder}`).set({
          sceneOrder: packScene.sceneOrder,
          sceneName: packScene.sceneName,
          status: "pending",
          outputImageUrl: null,
          promptUsed: null,
          generationTimeMs: null,
          createdAt: FieldValue.serverTimestamp(),
          completedAt: null,
        });
      }

      logger.info(`Story doc created: ${storyId} with ${totalScenes} scenes`, {
        ...LOG_CTX,
        userId,
        storyId,
      });

      // 8. Download reference image (used for ALL scenes)
      const inputImageBuffer = await downloadImage(inputImagePath);
      const referenceImageBase64 = bufferToBase64(inputImageBuffer);

      // 9. Process each scene SEQUENTIALLY for consistency
      let previousSceneImageBase64: string | null = null;
      let completedCount = 0;

      for (const packScene of packScenes) {
        const sceneStartTime = Date.now();
        const sceneDocRef = scenesCollection.doc(`scene_${packScene.sceneOrder}`);

        try {
          // Mark scene as processing
          await sceneDocRef.update({ status: "processing" });

          // 9a. Optimize prompt with story context
          const storyContext = [
            `Story: ${pack.name}`,
            `Scene ${packScene.sceneOrder}/${totalScenes}: ${packScene.sceneName}`,
            `Category: ${pack.category}`,
            completedCount > 0
              ? `This is a continuation scene. Maintain visual consistency with previous scenes.`
              : `This is the opening scene of the story.`,
          ].join(". ");

          const optimizedPrompt = await optimizePrompt(
            packScene.promptTemplate,
            packScene.styleHint || "realistic",
            storyContext
          );

          // 9b. Generate image with face/subject consistency
          const imagenConfig: ImagenConfig = {
            guidanceScale: packScene.imagenParams?.guidanceScale || 8.0,
            numberOfImages: 1,
            aspectRatio: packScene.imagenParams?.aspectRatio || "9:16",
            safetyFilterLevel: "BLOCK_MEDIUM_AND_ABOVE",
            negativePrompt: packScene.negativePrompt || undefined,
          };

          const outputBuffer = await generateImageWithConsistency(
            optimizedPrompt,
            referenceImageBase64,
            previousSceneImageBase64,
            imagenConfig
          );

          // 9c. Upload scene result
          const scenePath = `${STORAGE_PATHS.STORIES}/${userId}/${storyId}/scene_${packScene.sceneOrder}.png`;
          const sceneUrl = await uploadImage(outputBuffer, scenePath);

          // Keep the current scene for next scene's style reference
          previousSceneImageBase64 = bufferToBase64(outputBuffer);

          // 9d. Update scene doc
          const sceneTimeMs = Date.now() - sceneStartTime;
          await sceneDocRef.update({
            status: "completed",
            outputImageUrl: sceneUrl,
            promptUsed: optimizedPrompt,
            generationTimeMs: sceneTimeMs,
            completedAt: FieldValue.serverTimestamp(),
          });

          completedCount++;

          // 9e. Update story progress
          await storyRef.update({
            completedScenes: completedCount,
          });

          logger.info(
            `Scene ${packScene.sceneOrder}/${totalScenes} completed in ${sceneTimeMs}ms`,
            { ...LOG_CTX, userId, storyId }
          );
        } catch (sceneError) {
          // Mark this scene as failed but continue with the rest
          logger.error(
            `Scene ${packScene.sceneOrder} failed`,
            sceneError,
            { ...LOG_CTX, userId, storyId }
          );

          await sceneDocRef.update({
            status: "failed",
            completedAt: FieldValue.serverTimestamp(),
          });

          // Do not break — attempt remaining scenes even if one fails
        }
      }

      // 10. Mark story as completed (or partially completed)
      const finalStatus = completedCount === totalScenes ? "completed" : "completed";
      // Even if some scenes failed, we mark the story as completed so the user
      // can see what was generated. The individual scene statuses show failures.
      await storyRef.update({
        status: finalStatus,
        completedScenes: completedCount,
        completedAt: FieldValue.serverTimestamp(),
      });

      // Update user stats
      await db
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .update({
          totalStories: FieldValue.increment(1),
          lastActiveAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

      // Increment story pack usage count
      await db
        .collection(COLLECTIONS.STORY_PACKS)
        .doc(storyPackId)
        .update({
          usageCount: FieldValue.increment(1),
        });

      logger.info(
        `FlexTale completed: ${storyId} (${completedCount}/${totalScenes} scenes)`,
        { ...LOG_CTX, userId, storyId }
      );

      // 11. Return result
      return {
        storyId,
        status: "completed",
        totalScenes,
        creditsSpent: creditCost,
        creditsRemaining,
      };
    } catch (error) {
      logger.error("FlexTale generation failed", error, {
        ...LOG_CTX,
        userId,
      });
      throw wrapError(error);
    }
  }
);
