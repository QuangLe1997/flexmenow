import { onCall } from "firebase-functions/v2/https";
import { REGION } from "../config/constants";
import { getDb } from "../config/firebase";
import { logger } from "../utils/logger";
import { wrapError } from "../utils/errors";

const LOG_CTX = { functionName: "resetGlowDaily" };

/**
 * resetGlowDaily — Callable function to reset the user's daily glow counter.
 *
 * Called by the client on app launch. Checks if the last reset date is not today,
 * and if so, resets glowUsedToday to 0. Server-side to prevent client manipulation.
 */
export const resetGlowDaily = onCall(
  {
    region: REGION,
    memory: "256MiB",
    timeoutSeconds: 10,
    enforceAppCheck: true,
  },
  async (request) => {
    if (!request.auth) {
      return { status: "unauthenticated" };
    }

    const userId = request.auth.uid;

    try {
      const db = getDb();
      const userRef = db.collection("users").doc(userId);
      const doc = await userRef.get();

      if (!doc.exists) {
        return { status: "no_user", reset: false };
      }

      const data = doc.data()!;
      const lastReset = data.glowLastResetDate as string | undefined;
      const today = new Date().toISOString().substring(0, 10);

      if (lastReset !== today) {
        const { FieldValue } = await import("firebase-admin/firestore");
        await userRef.update({
          glowUsedToday: 0,
          glowLastResetDate: today,
          updatedAt: FieldValue.serverTimestamp(),
        });

        logger.info(`Reset glow counter for ${userId}`, { ...LOG_CTX, userId });
        return { status: "reset", reset: true };
      }

      return { status: "already_reset", reset: false };
    } catch (error) {
      logger.error("Failed to reset glow daily", error, { ...LOG_CTX, userId });
      throw wrapError(error);
    }
  }
);
