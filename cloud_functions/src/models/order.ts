import { Timestamp } from "firebase-admin/firestore";

export type OrderStatus = "pending" | "completed" | "failed" | "refunded";
export type OrderSource = "revenuecat" | "stripe" | "manual";

export interface Order {
  userId: string;
  productId: string;
  source: OrderSource;
  externalTransactionId: string;

  amount: number;
  currency: string;
  creditsGranted: number;

  status: OrderStatus;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreditLogType =
  | "daily_free"
  | "purchase"
  | "spend_flexshot"
  | "spend_flextale"
  | "refund"
  | "bonus"
  | "referral"
  | "welcome";

export interface CreditLog {
  userId: string;
  amount: number;
  type: CreditLogType;
  referenceId: string | null;
  referenceType: "generation" | "story" | "order" | null;
  balanceAfter: number;
  description: string;
  createdAt: Timestamp;
}

/** RevenueCat webhook event types */
export type RevenueCatEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "CANCELLATION"
  | "EXPIRATION"
  | "NON_RENEWING_PURCHASE"
  | "PRODUCT_CHANGE"
  | "BILLING_ISSUE"
  | "SUBSCRIBER_ALIAS";

export interface RevenueCatWebhookEvent {
  api_version: string;
  event: {
    type: RevenueCatEventType;
    app_user_id: string;
    product_id: string;
    entitlement_ids: string[];
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    store: string;
    environment: string;
    original_app_user_id: string;
    price_in_purchased_currency: number;
    currency: string;
    transaction_id: string;
  };
}

/** Maps RevenueCat product IDs to internal plan/credit values */
export interface ProductMapping {
  plan: "basic" | "pro" | null;
  credits: number;
  isSubscription: boolean;
}
