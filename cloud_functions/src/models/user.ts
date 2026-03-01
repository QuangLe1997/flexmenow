import { Timestamp } from "firebase-admin/firestore";

export type AuthProvider = "google" | "apple" | "email";
export type SubscriptionPlan = "free" | "basic" | "pro";

export interface User {
  // Identity
  email: string;
  displayName: string;
  avatarUrl: string;
  authProvider: AuthProvider;

  // Credits & Subscription
  creditsBalance: number;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: Timestamp | null;
  revenuecatAppUserId: string | null;

  // Stats
  totalGenerations: number;
  totalStories: number;

  // Preferences
  locale: string;
  timezone: string;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActiveAt: Timestamp;
  fcmToken: string | null;
}

export interface UserCreateData {
  uid: string;
  email: string | undefined;
  displayName: string | undefined;
  photoURL: string | undefined;
  providerId: string;
}

export function buildNewUserDoc(authData: UserCreateData): Omit<User, "createdAt" | "updatedAt" | "lastActiveAt"> & {
  createdAt: ReturnType<typeof import("firebase-admin/firestore").FieldValue.serverTimestamp>;
  updatedAt: ReturnType<typeof import("firebase-admin/firestore").FieldValue.serverTimestamp>;
  lastActiveAt: ReturnType<typeof import("firebase-admin/firestore").FieldValue.serverTimestamp>;
} {
  const { FieldValue } = require("firebase-admin/firestore");
  const providerMap: Record<string, AuthProvider> = {
    "google.com": "google",
    "apple.com": "apple",
    "password": "email",
  };

  return {
    email: authData.email || "",
    displayName: authData.displayName || "",
    avatarUrl: authData.photoURL || "",
    authProvider: providerMap[authData.providerId] || "email",
    creditsBalance: 0, // set separately via addCredits
    subscriptionPlan: "free",
    subscriptionExpiresAt: null,
    revenuecatAppUserId: null,
    totalGenerations: 0,
    totalStories: 0,
    locale: "en",
    timezone: "UTC",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastActiveAt: FieldValue.serverTimestamp(),
    fcmToken: null,
  };
}
