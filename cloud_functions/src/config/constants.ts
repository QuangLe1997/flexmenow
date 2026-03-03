/**
 * FlexMe Cloud Functions Constants
 *
 * All configurable values are sourced from environment variables
 * with sensible defaults for local development.
 */

// ---------- Region & Project ----------
export const REGION = "asia-southeast1";
export const PROJECT_ID = process.env.GCLOUD_PROJECT || "flexme-now";
export const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET || "flexme-now.firebasestorage.app";

// ---------- AI / ML ----------
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_MODEL = "gemini-2.0-flash";
export const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || "us-central1";
export const IMAGEN_MODEL =
  process.env.IMAGEN_MODEL || "imagen-3.0-capability-001";
export const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

// ---------- Credits ----------
export const NEW_USER_FREE_CREDITS = parseInt(
  process.env.NEW_USER_FREE_CREDITS || "12",
  10
);
export const TEMPLATE_CREDIT_COST = parseInt(
  process.env.TEMPLATE_CREDIT_COST || "1",
  10
);
export const PREMIUM_TEMPLATE_CREDIT_COST = parseInt(
  process.env.PREMIUM_TEMPLATE_CREDIT_COST || "2",
  10
);
export const FLEXTALE_BASE_CREDIT_COST = 5;
export const FLEXTALE_PER_SCENE_COST = 1;
export const GLOW_FREE_DAILY_LIMIT = 10;
export const GLOW_CREDIT_COST = 0.5;

// ---------- RevenueCat ----------
export const REVENUECAT_WEBHOOK_SECRET =
  process.env.REVENUECAT_WEBHOOK_SECRET || "";

// ---------- Function Timeouts ----------
export const FLEXSHOT_TIMEOUT_SECONDS = 300;
export const FLEXTALE_TIMEOUT_SECONDS = 600;
export const FLEXLOCKET_TIMEOUT_SECONDS = 120;
export const DEFAULT_TIMEOUT_SECONDS = 60;

// ---------- Function Memory ----------
export const FLEXSHOT_MEMORY = "1GiB" as const;
export const FLEXTALE_MEMORY = "2GiB" as const;
export const FLEXLOCKET_MEMORY = "512MiB" as const;

// ---------- Firestore Collections ----------
export const COLLECTIONS = {
  USERS: "users",
  TEMPLATES: "templates",
  STORY_PACKS: "storyPacks",
  GENERATIONS: "generations",
  STORIES: "stories",
  ENHANCEMENTS: "enhancements",
  ORDERS: "orders",
  CREDIT_LOGS: "creditLogs",
  APP_CONFIG: "appConfig",
} as const;

// ---------- Storage Paths ----------
export const STORAGE_PATHS = {
  UPLOADS: "uploads",
  GENERATIONS: "generations",
  STORIES: "stories",
} as const;

// ---------- RevenueCat Product Mapping ----------
import { ProductMapping } from "../models/order";

export const PRODUCT_MAP: Record<string, ProductMapping> = {
  // Subscriptions
  "flexme_basic_monthly": {
    plan: "basic",
    credits: 100,
    isSubscription: true,
  },
  "flexme_pro_monthly": {
    plan: "pro",
    credits: 500,
    isSubscription: true,
  },
  // One-time credit packs
  "flexme_credits_20": {
    plan: null,
    credits: 20,
    isSubscription: false,
  },
  "flexme_credits_50": {
    plan: null,
    credits: 50,
    isSubscription: false,
  },
  "flexme_credits_100": {
    plan: null,
    credits: 100,
    isSubscription: false,
  },
};
