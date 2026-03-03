import { onCall, HttpsError } from "firebase-functions/v2/https";
import { REGION, NEW_USER_FREE_CREDITS } from "../config/constants";
import { createUserDoc } from "../services/user_service";
import { addCredits } from "../services/credits_service";
import { logger } from "../utils/logger";
import { getDb } from "../config/firebase";

const LOG_CTX = { functionName: "onUserCreate" };

/**
 * onUserCreate — Callable function that the client calls right after
 * Firebase Auth sign-in to ensure the user document exists in Firestore.
 *
 * We use a callable instead of `beforeUserCreated` because the blocking
 * function requires Identity Platform (GCIP) which is not enabled.
 *
 * Steps:
 *  1. Verify auth context
 *  2. Check if user doc already exists (idempotent)
 *  3. If not, create the user document in Firestore with defaults
 *  4. Grant welcome credits (NEW_USER_FREE_CREDITS)
 *  5. Write the initial creditLog entry
 */
export const onUserCreate = onCall(
  {
    region: REGION,
    memory: "256MiB",
    timeoutSeconds: 30,
  },
  async (request) => {
    // 1. Verify auth
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const userId = request.auth.uid;
    const email = request.auth.token.email || undefined;
    const displayName = request.auth.token.name || undefined;
    const photoURL = request.auth.token.picture || undefined;
    const providerId = request.auth.token.firebase?.sign_in_provider || "anonymous";

    logger.info(`Ensuring user doc for: ${userId}`, { ...LOG_CTX, userId });

    try {
      // 2. Check if user doc already exists
      const db = getDb();
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        logger.info(`User doc already exists for ${userId}`, { ...LOG_CTX, userId });
        return { status: "exists", userId };
      }

      // 3. Create user document in Firestore
      await createUserDoc(userId, {
        uid: userId,
        email,
        displayName,
        photoURL,
        providerId,
      });

      // 4. Grant welcome credits
      await addCredits(
        userId,
        NEW_USER_FREE_CREDITS,
        "welcome",
        null,
        `Welcome bonus: ${NEW_USER_FREE_CREDITS} free credits`
      );

      logger.info(
        `User ${userId} created with ${NEW_USER_FREE_CREDITS} welcome credits`,
        { ...LOG_CTX, userId }
      );

      return { status: "created", userId, credits: NEW_USER_FREE_CREDITS };
    } catch (error) {
      logger.error("Failed to set up new user doc", error, {
        ...LOG_CTX,
        userId,
      });
      throw new HttpsError("internal", "Failed to create user document");
    }
  }
);
