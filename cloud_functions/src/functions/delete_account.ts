import { onCall, HttpsError } from "firebase-functions/v2/https";
import { REGION, COLLECTIONS, STORAGE_PATHS } from "../config/constants";
import { getDb, getStorageInstance, getAuthInstance } from "../config/firebase";
import { logger } from "../utils/logger";

const LOG_CTX = { functionName: "deleteAccount" };

/**
 * deleteAccount — Callable function that deletes all user data and the auth account.
 *
 * Required by Apple App Store guideline 5.1.1 (v2).
 *
 * Steps:
 *  1. Verify auth context
 *  2. Delete user's Firestore documents (generations, stories, enhancements, creditLogs, orders)
 *  3. Delete user's Storage files (uploads/, generations/, stories/)
 *  4. Delete user Firestore doc
 *  5. Delete Firebase Auth account
 */
export const deleteAccount = onCall(
  {
    region: REGION,
    memory: "512MiB",
    timeoutSeconds: 120,
    enforceAppCheck: true,
  },
  async (request) => {
    // 1. Verify auth
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const userId = request.auth.uid;
    logger.info(`Starting account deletion for: ${userId}`, { ...LOG_CTX, userId });

    const db = getDb();
    const storage = getStorageInstance();
    const auth = getAuthInstance();

    try {
      // 2. Delete Firestore sub-collections owned by user
      const collectionsToClean = [
        COLLECTIONS.GENERATIONS,
        COLLECTIONS.STORIES,
        COLLECTIONS.ENHANCEMENTS,
        COLLECTIONS.CREDIT_LOGS,
        COLLECTIONS.ORDERS,
      ];

      for (const colName of collectionsToClean) {
        const snap = await db.collection(colName)
          .where("userId", "==", userId)
          .limit(500)
          .get();

        if (!snap.empty) {
          const batch = db.batch();
          for (const doc of snap.docs) {
            // For stories, also delete scenes subcollection
            if (colName === COLLECTIONS.STORIES) {
              const scenes = await doc.ref.collection("scenes").get();
              for (const scene of scenes.docs) {
                batch.delete(scene.ref);
              }
            }
            batch.delete(doc.ref);
          }
          await batch.commit();
          logger.info(`Deleted ${snap.size} docs from ${colName}`, { ...LOG_CTX, userId });
        }
      }

      // 3. Delete Storage files
      const storagePaths = [
        `${STORAGE_PATHS.UPLOADS}/${userId}/`,
        `${STORAGE_PATHS.GENERATIONS}/${userId}/`,
        `${STORAGE_PATHS.STORIES}/${userId}/`,
      ];

      for (const prefix of storagePaths) {
        try {
          const [files] = await storage.bucket().getFiles({ prefix });
          if (files.length > 0) {
            await Promise.all(files.map((file) => file.delete()));
            logger.info(`Deleted ${files.length} files from ${prefix}`, { ...LOG_CTX, userId });
          }
        } catch (e) {
          logger.warn(`Failed to delete storage ${prefix}: ${e}`, { ...LOG_CTX, userId });
        }
      }

      // 4. Delete user Firestore doc
      await db.collection(COLLECTIONS.USERS).doc(userId).delete();
      logger.info(`Deleted user doc`, { ...LOG_CTX, userId });

      // 5. Delete Firebase Auth account
      await auth.deleteUser(userId);
      logger.info(`Deleted auth account`, { ...LOG_CTX, userId });

      logger.info(`Account deletion complete for: ${userId}`, { ...LOG_CTX, userId });
      return { status: "deleted", userId };
    } catch (error) {
      logger.error("Failed to delete account", error, { ...LOG_CTX, userId });
      throw new HttpsError("internal", "Failed to delete account. Please contact support.");
    }
  }
);
