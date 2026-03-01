import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../config/firebase";
import { COLLECTIONS } from "../config/constants";
import { CreditLogType } from "../models/order";
import { throwInsufficientCredits, throwNotFound } from "../utils/errors";
import { logger } from "../utils/logger";

const LOG_CTX = { functionName: "credits_service" };

/**
 * Check that a user has enough credits and atomically deduct them.
 *
 * Uses a Firestore transaction to prevent race conditions where
 * two concurrent requests could both succeed on the same balance.
 *
 * @returns The new balance after deduction.
 */
export async function checkAndDeductCredits(
  userId: string,
  amount: number,
  type: CreditLogType,
  referenceId: string,
  description: string
): Promise<number> {
  const db = getDb();
  const userRef = db.collection(COLLECTIONS.USERS).doc(userId);

  const newBalance = await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throwNotFound("User", userId);
    }

    const currentBalance = userSnap.data()!.creditsBalance as number;
    if (currentBalance < amount) {
      throwInsufficientCredits(amount, currentBalance);
    }

    const updatedBalance = currentBalance - amount;

    // Deduct credits from user doc
    transaction.update(userRef, {
      creditsBalance: updatedBalance,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Write credit log entry
    const logRef = db.collection(COLLECTIONS.CREDIT_LOGS).doc();
    transaction.set(logRef, {
      userId,
      amount: -amount,
      type,
      referenceId,
      referenceType: referenceTypeFromLogType(type),
      balanceAfter: updatedBalance,
      description,
      createdAt: FieldValue.serverTimestamp(),
    });

    return updatedBalance;
  });

  logger.info(
    `Deducted ${amount} credits. New balance: ${newBalance}`,
    { ...LOG_CTX, userId }
  );

  return newBalance;
}

/**
 * Add credits to a user account (purchase, bonus, welcome, refund, etc.).
 *
 * @returns The new balance after addition.
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: CreditLogType,
  referenceId: string | null,
  description: string
): Promise<number> {
  const db = getDb();
  const userRef = db.collection(COLLECTIONS.USERS).doc(userId);

  const newBalance = await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throwNotFound("User", userId);
    }

    const currentBalance = userSnap.data()!.creditsBalance as number;
    const updatedBalance = currentBalance + amount;

    transaction.update(userRef, {
      creditsBalance: updatedBalance,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const logRef = db.collection(COLLECTIONS.CREDIT_LOGS).doc();
    transaction.set(logRef, {
      userId,
      amount: +amount,
      type,
      referenceId,
      referenceType: referenceTypeFromLogType(type),
      balanceAfter: updatedBalance,
      description,
      createdAt: FieldValue.serverTimestamp(),
    });

    return updatedBalance;
  });

  logger.info(
    `Added ${amount} credits. New balance: ${newBalance}`,
    { ...LOG_CTX, userId }
  );

  return newBalance;
}

/**
 * Derive the referenceType field from the credit log type.
 */
function referenceTypeFromLogType(
  type: CreditLogType
): "generation" | "story" | "order" | null {
  switch (type) {
    case "spend_flexshot":
      return "generation";
    case "spend_flextale":
      return "story";
    case "purchase":
    case "refund":
      return "order";
    default:
      return null;
  }
}
