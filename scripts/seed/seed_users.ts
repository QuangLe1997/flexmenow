/**
 * seed_users.ts
 *
 * Creates 3 test users in Firestore with different subscription plans
 * (free, pro, elite) and credit balances.
 *
 * Usage:
 *   npx ts-node seed/seed_users.ts [--dry-run] [--emulator]
 *
 * Options:
 *   --dry-run    Print user data to stdout without writing to Firestore
 *   --emulator   Use Firestore emulator (localhost:8080)
 */

import * as admin from "firebase-admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  plan: "free" | "pro" | "elite";
  credits: number;
  creditsUsed: number;
  glowUsesToday: number;
  glowDailyLimit: number;
  language: string;
  theme: "dark" | "light" | "system";
  notifications: boolean;
  onboardingComplete: boolean;
  subscription: {
    plan: "free" | "pro" | "elite";
    status: "active" | "canceled" | "expired" | "none";
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  };
  stats: {
    totalGlows: number;
    totalShots: number;
    totalTales: number;
    totalShares: number;
  };
  createdAt: admin.firestore.FieldValue | string;
  updatedAt: admin.firestore.FieldValue | string;
}

// ---------------------------------------------------------------------------
// Test user data
// ---------------------------------------------------------------------------

function buildTestUsers(): UserProfile[] {
  const now = new Date().toISOString();
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      uid: "test_user_free_001",
      email: "free@flexmenow.test",
      displayName: "Alex Free",
      photoURL: null,
      plan: "free",
      credits: 5,
      creditsUsed: 3,
      glowUsesToday: 2,
      glowDailyLimit: 10,
      language: "en",
      theme: "dark",
      notifications: true,
      onboardingComplete: true,
      subscription: {
        plan: "free",
        status: "none",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      },
      stats: {
        totalGlows: 15,
        totalShots: 3,
        totalTales: 0,
        totalShares: 5,
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      uid: "test_user_pro_002",
      email: "pro@flexmenow.test",
      displayName: "Jordan Pro",
      photoURL: "https://storage.googleapis.com/flexmenow.firebasestorage.app/avatars/test_pro.jpg",
      plan: "pro",
      credits: 80,
      creditsUsed: 45,
      glowUsesToday: 0,
      glowDailyLimit: 50,
      language: "en",
      theme: "dark",
      notifications: true,
      onboardingComplete: true,
      subscription: {
        plan: "pro",
        status: "active",
        stripeCustomerId: "cus_test_pro_001",
        stripeSubscriptionId: "sub_test_pro_001",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      stats: {
        totalGlows: 120,
        totalShots: 35,
        totalTales: 5,
        totalShares: 42,
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      uid: "test_user_elite_003",
      email: "elite@flexmenow.test",
      displayName: "Taylor Elite",
      photoURL: "https://storage.googleapis.com/flexmenow.firebasestorage.app/avatars/test_elite.jpg",
      plan: "elite",
      credits: 200,
      creditsUsed: 180,
      glowUsesToday: 0,
      glowDailyLimit: -1, // unlimited
      language: "vi",
      theme: "dark",
      notifications: true,
      onboardingComplete: true,
      subscription: {
        plan: "elite",
        status: "active",
        stripeCustomerId: "cus_test_elite_001",
        stripeSubscriptionId: "sub_test_elite_001",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      stats: {
        totalGlows: 450,
        totalShots: 120,
        totalTales: 25,
        totalShares: 200,
      },
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): { dryRun: boolean; emulator: boolean } {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    emulator: args.includes("--emulator"),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { dryRun, emulator } = parseArgs();
  const users = buildTestUsers();

  console.log("[seed_users] Test users to create:");
  users.forEach((u) => {
    console.log(`  - ${u.displayName} (${u.email}) | plan: ${u.plan} | credits: ${u.credits}`);
  });

  if (dryRun) {
    console.log("\n[seed_users] --dry-run mode, printing JSON:\n");
    console.log(JSON.stringify(users, null, 2));
    return;
  }

  // Set emulator env if requested
  if (emulator) {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "localhost:8080";
    console.log(
      `[seed_users] Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`
    );
  }

  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.GCLOUD_PROJECT || "flexmenow",
    });
  }

  const db = admin.firestore();
  const batch = db.batch();

  for (const user of users) {
    const userRef = db.collection("users").doc(user.uid);

    // Replace ISO strings with Firestore server timestamps for createdAt/updatedAt
    const firestoreUser = {
      ...user,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.set(userRef, firestoreUser, { merge: true });
    console.log(`[seed_users] Queued: ${user.uid} -> users/${user.uid}`);
  }

  try {
    await batch.commit();
    console.log(`[seed_users] Successfully created ${users.length} test users in Firestore.`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[seed_users] Firestore write failed: ${message}`);

    if (!emulator) {
      console.error(
        "[seed_users] Tip: Use --emulator flag to write to local emulator, " +
          "or ensure GOOGLE_APPLICATION_CREDENTIALS is set."
      );
    }
    process.exit(1);
  }

  // Also seed credit transaction history for each user
  console.log("[seed_users] Seeding credit transaction history...");

  const txBatch = db.batch();
  const txTemplates = [
    { type: "signup_bonus", amount: 5, description: "Welcome bonus credits" },
    { type: "subscription", amount: 80, description: "Pro plan monthly credits" },
    { type: "flexshot", amount: -1, description: "FlexShot: Paris Eiffel" },
    { type: "flexshot", amount: -2, description: "FlexShot: Lamborghini Night" },
    { type: "flextale", amount: -8, description: "FlexTale: Paris 7 Days" },
  ];

  for (const user of users) {
    const relevantTxs =
      user.plan === "free"
        ? txTemplates.slice(0, 1)
        : user.plan === "pro"
        ? txTemplates.slice(0, 4)
        : txTemplates;

    for (const tx of relevantTxs) {
      const txRef = db
        .collection("users")
        .doc(user.uid)
        .collection("credit_transactions")
        .doc();

      txBatch.set(txRef, {
        ...tx,
        userId: user.uid,
        balanceAfter: user.credits,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  try {
    await txBatch.commit();
    console.log("[seed_users] Credit transaction history seeded.");
    console.log("[seed_users] Done.");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[seed_users] Transaction history write failed: ${message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[seed_users] Fatal error:", err);
  process.exit(1);
});
