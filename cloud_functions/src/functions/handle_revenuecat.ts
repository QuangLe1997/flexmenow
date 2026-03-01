import { onRequest } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../config/firebase";
import {
  REGION,
  REVENUECAT_WEBHOOK_SECRET,
  COLLECTIONS,
  PRODUCT_MAP,
} from "../config/constants";
import {
  RevenueCatWebhookEvent,
  ProductMapping,
} from "../models/order";
import { addCredits } from "../services/credits_service";
import { updateSubscription } from "../services/user_service";
import { logger } from "../utils/logger";

const LOG_CTX = { functionName: "handleEventRevenueCat" };

/**
 * handleEventRevenueCat — HTTPS endpoint for RevenueCat webhook events.
 *
 * RevenueCat sends POST requests to this endpoint whenever a subscription
 * or purchase event occurs. This function:
 *
 *  1. Verifies the webhook authorization secret
 *  2. Parses the event type and payload
 *  3. Maps the productId to internal plan/credit values
 *  4. Updates the user's subscription/credits via Firestore transaction
 *  5. Writes order and creditLog entries for audit trail
 *
 * Supported events:
 *  - INITIAL_PURCHASE: New subscription or one-time purchase
 *  - RENEWAL: Subscription renewal
 *  - CANCELLATION: User cancelled (still active until period end)
 *  - EXPIRATION: Subscription expired
 *  - NON_RENEWING_PURCHASE: One-time credit pack purchase
 *  - PRODUCT_CHANGE: User switched plans (upgrade/downgrade)
 */
export const handleEventRevenueCat = onRequest(
  {
    region: REGION,
    timeoutSeconds: 30,
    memory: "256MiB",
    maxInstances: 20,
  },
  async (req, res) => {
    // Only accept POST
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    // 1. Verify webhook secret via Authorization header
    const authHeader = req.headers.authorization;
    if (!REVENUECAT_WEBHOOK_SECRET) {
      logger.error("REVENUECAT_WEBHOOK_SECRET is not configured", null, LOG_CTX);
      res.status(500).send("Webhook secret not configured");
      return;
    }

    if (!authHeader || authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
      logger.warn("Invalid webhook authorization", LOG_CTX);
      res.status(401).send("Unauthorized");
      return;
    }

    try {
      // 2. Parse event
      const payload = req.body as RevenueCatWebhookEvent;
      if (!payload || !payload.event) {
        logger.warn("Invalid webhook payload: missing event", LOG_CTX);
        res.status(400).send("Invalid payload");
        return;
      }

      const event = payload.event;
      const eventType = event.type;
      const appUserId = event.app_user_id;
      const productId = event.product_id;
      const transactionId = event.transaction_id;

      logger.info(`RevenueCat event: ${eventType} for user ${appUserId}`, {
        ...LOG_CTX,
        userId: appUserId,
      });

      // Ignore sandbox/test events in production (optional guard)
      if (event.environment === "SANDBOX" && process.env.NODE_ENV === "production") {
        logger.info("Ignoring sandbox event in production", LOG_CTX);
        res.status(200).send("OK (sandbox ignored)");
        return;
      }

      // 3. Route by event type
      switch (eventType) {
        case "INITIAL_PURCHASE":
          await handleInitialPurchase(appUserId, productId, transactionId, event);
          break;

        case "RENEWAL":
          await handleRenewal(appUserId, productId, transactionId, event);
          break;

        case "CANCELLATION":
          await handleCancellation(appUserId, event);
          break;

        case "EXPIRATION":
          await handleExpiration(appUserId, event);
          break;

        case "NON_RENEWING_PURCHASE":
          await handleNonRenewingPurchase(appUserId, productId, transactionId, event);
          break;

        case "PRODUCT_CHANGE":
          await handleProductChange(appUserId, productId, transactionId, event);
          break;

        default:
          logger.info(`Unhandled event type: ${eventType}`, {
            ...LOG_CTX,
            userId: appUserId,
          });
      }

      res.status(200).send("OK");
    } catch (error) {
      logger.error("RevenueCat webhook processing failed", error, LOG_CTX);
      // Return 500 so RevenueCat retries the webhook
      res.status(500).send("Internal error");
    }
  }
);

/**
 * Handle a new subscription or first-time purchase.
 */
async function handleInitialPurchase(
  userId: string,
  productId: string,
  transactionId: string,
  event: RevenueCatWebhookEvent["event"]
): Promise<void> {
  const mapping = getProductMapping(productId);
  if (!mapping) return;

  // Write order record
  await writeOrder(userId, productId, transactionId, event, mapping);

  if (mapping.isSubscription && mapping.plan) {
    // Activate subscription
    const expiresAt = event.expiration_at_ms
      ? new Date(event.expiration_at_ms)
      : null;
    await updateSubscription(userId, mapping.plan, expiresAt);

    // Grant subscription credits
    await addCredits(
      userId,
      mapping.credits,
      "purchase",
      transactionId,
      `Subscription: ${productId}`
    );
  } else {
    // One-time credit purchase
    await addCredits(
      userId,
      mapping.credits,
      "purchase",
      transactionId,
      `Credit pack: ${productId}`
    );
  }

  logger.info(`Initial purchase processed: ${productId}`, {
    ...LOG_CTX,
    userId,
  });
}

/**
 * Handle subscription renewal.
 */
async function handleRenewal(
  userId: string,
  productId: string,
  transactionId: string,
  event: RevenueCatWebhookEvent["event"]
): Promise<void> {
  const mapping = getProductMapping(productId);
  if (!mapping) return;

  await writeOrder(userId, productId, transactionId, event, mapping);

  if (mapping.plan) {
    const expiresAt = event.expiration_at_ms
      ? new Date(event.expiration_at_ms)
      : null;
    await updateSubscription(userId, mapping.plan, expiresAt);
  }

  // Grant renewal credits
  await addCredits(
    userId,
    mapping.credits,
    "purchase",
    transactionId,
    `Renewal: ${productId}`
  );

  logger.info(`Renewal processed: ${productId}`, { ...LOG_CTX, userId });
}

/**
 * Handle cancellation (user cancelled, but access continues until period end).
 */
async function handleCancellation(
  userId: string,
  _event: RevenueCatWebhookEvent["event"]
): Promise<void> {
  // No immediate action — the subscription remains active until EXPIRATION.
  // We log the cancellation for analytics/tracking.
  const db = getDb();
  await db.collection(COLLECTIONS.USERS).doc(userId).update({
    updatedAt: FieldValue.serverTimestamp(),
  });

  logger.info(`Cancellation recorded for user ${userId}`, {
    ...LOG_CTX,
    userId,
  });
}

/**
 * Handle subscription expiration (access should be revoked).
 */
async function handleExpiration(
  userId: string,
  _event: RevenueCatWebhookEvent["event"]
): Promise<void> {
  // Downgrade to free plan
  await updateSubscription(userId, "free", null);

  logger.info(`Subscription expired, downgraded to free: ${userId}`, {
    ...LOG_CTX,
    userId,
  });
}

/**
 * Handle a one-time (non-renewing) purchase.
 */
async function handleNonRenewingPurchase(
  userId: string,
  productId: string,
  transactionId: string,
  event: RevenueCatWebhookEvent["event"]
): Promise<void> {
  const mapping = getProductMapping(productId);
  if (!mapping) return;

  await writeOrder(userId, productId, transactionId, event, mapping);

  await addCredits(
    userId,
    mapping.credits,
    "purchase",
    transactionId,
    `Credit pack: ${productId}`
  );

  logger.info(`Non-renewing purchase processed: ${productId}`, {
    ...LOG_CTX,
    userId,
  });
}

/**
 * Handle a plan change (upgrade or downgrade).
 */
async function handleProductChange(
  userId: string,
  productId: string,
  transactionId: string,
  event: RevenueCatWebhookEvent["event"]
): Promise<void> {
  const mapping = getProductMapping(productId);
  if (!mapping) return;

  await writeOrder(userId, productId, transactionId, event, mapping);

  if (mapping.isSubscription && mapping.plan) {
    const expiresAt = event.expiration_at_ms
      ? new Date(event.expiration_at_ms)
      : null;
    await updateSubscription(userId, mapping.plan, expiresAt);

    // Grant the new plan's credits
    await addCredits(
      userId,
      mapping.credits,
      "purchase",
      transactionId,
      `Plan change to: ${productId}`
    );
  }

  logger.info(`Product change processed: ${productId}`, {
    ...LOG_CTX,
    userId,
  });
}

// -------------------- Helpers --------------------

/**
 * Look up a product mapping from the PRODUCT_MAP constant.
 * Returns null and logs a warning for unknown product IDs.
 */
function getProductMapping(productId: string): ProductMapping | null {
  const mapping = PRODUCT_MAP[productId];
  if (!mapping) {
    logger.warn(`Unknown productId: ${productId}`, LOG_CTX);
    return null;
  }
  return mapping;
}

/**
 * Write an order record to Firestore for audit trail.
 */
async function writeOrder(
  userId: string,
  productId: string,
  transactionId: string,
  event: RevenueCatWebhookEvent["event"],
  mapping: ProductMapping
): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTIONS.ORDERS).doc(transactionId).set({
    userId,
    productId,
    source: "revenuecat",
    externalTransactionId: transactionId,
    amount: event.price_in_purchased_currency || 0,
    currency: event.currency || "USD",
    creditsGranted: mapping.credits,
    status: "completed",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}
