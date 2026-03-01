import { beforeUserCreated } from "firebase-functions/v2/identity";
import { REGION, NEW_USER_FREE_CREDITS } from "../config/constants";
import { createUserDoc } from "../services/user_service";
import { addCredits } from "../services/credits_service";
import { logger } from "../utils/logger";

const LOG_CTX = { functionName: "onUserCreate" };

/**
 * onUserCreate — Auth trigger that fires before a new user is fully created.
 *
 * Uses `beforeUserCreated` (blocking function) to set up the user's Firestore
 * document and grant welcome credits before the client SDK resolves the
 * sign-in promise. This ensures the user doc is always ready by the time
 * the client first loads.
 *
 * Steps:
 *  1. Extract user identity from the auth event
 *  2. Create the user document in Firestore with defaults
 *  3. Grant welcome credits (NEW_USER_FREE_CREDITS)
 *  4. Write the initial creditLog entry
 *
 * If any step fails, the user creation is NOT blocked — we log the error
 * and let the user in. A background repair job can fix missing docs later.
 */
export const onUserCreate = beforeUserCreated(
  {
    region: REGION,
  },
  async (event) => {
    const user = event.data;
    const userId = user.uid;

    logger.info(`New user signing up: ${userId} (${user.email})`, {
      ...LOG_CTX,
      userId,
    });

    try {
      // 1. Determine provider
      const providerId =
        event.additionalUserInfo?.providerId ||
        (user.providerData && user.providerData.length > 0
          ? user.providerData[0].providerId
          : "password");

      // 2. Create user document in Firestore
      await createUserDoc(userId, {
        uid: userId,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        providerId,
      });

      // 3. Grant welcome credits
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
    } catch (error) {
      // Do not block user creation on failure — log and continue
      logger.error("Failed to set up new user doc", error, {
        ...LOG_CTX,
        userId,
      });
    }

    // Return nothing to allow the user creation to proceed
    return;
  }
);
