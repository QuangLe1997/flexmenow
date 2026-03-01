import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../config/firebase";
import { COLLECTIONS } from "../config/constants";
import { User, UserCreateData, buildNewUserDoc } from "../models/user";
import { throwNotFound } from "../utils/errors";
import { logger } from "../utils/logger";

const LOG_CTX = { functionName: "user_service" };

/**
 * Create a new user document in Firestore.
 *
 * Called by the onUserCreate auth trigger to initialize the user record
 * with default values.
 *
 * @returns The auto-populated user doc data.
 */
export async function createUserDoc(
  userId: string,
  authData: UserCreateData
): Promise<void> {
  const db = getDb();
  const userRef = db.collection(COLLECTIONS.USERS).doc(userId);

  const userData = buildNewUserDoc(authData);

  await userRef.set(userData);

  logger.info(`Created user doc for ${userId}`, { ...LOG_CTX, userId });
}

/**
 * Fetch a user document from Firestore.
 *
 * @throws NotFound if the user does not exist.
 */
export async function getUserDoc(userId: string): Promise<User> {
  const db = getDb();
  const userSnap = await db.collection(COLLECTIONS.USERS).doc(userId).get();

  if (!userSnap.exists) {
    throwNotFound("User", userId);
  }

  return userSnap.data() as User;
}

/**
 * Partially update a user document.
 */
export async function updateUserDoc(
  userId: string,
  data: Partial<Omit<User, "createdAt">>
): Promise<void> {
  const db = getDb();
  const userRef = db.collection(COLLECTIONS.USERS).doc(userId);

  await userRef.update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });

  logger.debug(`Updated user doc for ${userId}`, { ...LOG_CTX, userId });
}

/**
 * Update the user's subscription plan and expiration.
 * Used by RevenueCat webhook handler.
 */
export async function updateSubscription(
  userId: string,
  plan: "free" | "basic" | "pro",
  expiresAt: Date | null
): Promise<void> {
  const db = getDb();
  const { Timestamp } = await import("firebase-admin/firestore");

  await db
    .collection(COLLECTIONS.USERS)
    .doc(userId)
    .update({
      subscriptionPlan: plan,
      subscriptionExpiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
      updatedAt: FieldValue.serverTimestamp(),
    });

  logger.info(`Updated subscription for ${userId}: plan=${plan}`, {
    ...LOG_CTX,
    userId,
  });
}
