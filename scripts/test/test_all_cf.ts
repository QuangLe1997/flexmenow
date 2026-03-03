/**
 * Test all Cloud Functions (genFlexShot, genFlexTale, genFlexLocket, checkGeo)
 *
 * Calls each CF via Firebase callable HTTPS endpoint using a Firebase Auth ID token.
 * Requires: a test image uploaded to Storage, a valid Firebase user.
 *
 * Usage:
 *   npx ts-node test/test_all_cf.ts
 *   npx ts-node test/test_all_cf.ts --only=genFlexLocket
 *   npx ts-node test/test_all_cf.ts --only=genFlexShot
 *   npx ts-node test/test_all_cf.ts --only=genFlexTale
 *   npx ts-node test/test_all_cf.ts --only=checkGeo
 *
 * Environment:
 *   Uses gcloud access token for Firestore operations,
 *   and Firebase Auth REST API for getting an ID token.
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ID = "flexme-now";
const REGION = "asia-southeast1";
const CF_BASE = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;
const FIREBASE_API_KEY = "AIzaSyD..."; // Placeholder - we'll use callable URL directly

// Parse --only flag
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlyFunc = onlyArg ? onlyArg.split("=")[1] : null;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getAccessToken(): string {
  return execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim();
}

async function callCallable(
  functionName: string,
  data: Record<string, any>,
  accessToken: string
): Promise<{ ok: boolean; status: number; body: any }> {
  // Cloud Functions Gen 2 callable URL
  const url = `${CF_BASE}/${functionName}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ data }),
  });

  const text = await resp.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return { ok: resp.ok, status: resp.status, body };
}

// Upload a test image to Storage if needed
async function ensureTestImage(accessToken: string): Promise<string> {
  const storagePath = "uploads/test_user/test_photo.jpg";
  const bucket = `${PROJECT_ID}.firebasestorage.app`;

  // Check if test image exists
  const checkUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(storagePath)}`;
  const checkResp = await fetch(checkUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (checkResp.ok) {
    console.log(`  [storage] Test image already exists: ${storagePath}`);
    return storagePath;
  }

  // Upload a minimal test JPEG (1x1 white pixel)
  console.log(`  [storage] Uploading test image to ${storagePath}...`);
  // Minimal JPEG bytes (1x1 white pixel)
  const minimalJpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wgARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAVSf/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=",
    "base64"
  );

  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`;
  const uploadResp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "image/jpeg",
    },
    body: minimalJpeg,
  });

  if (!uploadResp.ok) {
    const err = await uploadResp.text();
    throw new Error(`Failed to upload test image: ${err}`);
  }

  console.log(`  [storage] Uploaded test image: ${storagePath}`);
  return storagePath;
}

// ──────────────────────────────────────────────
// Test Functions
// ──────────────────────────────────────────────

async function testCheckGeo(token: string) {
  console.log("\n--- Testing checkGeo ---");
  const result = await callCallable("checkGeo", {}, token);
  console.log(`  Status: ${result.status}`);
  console.log(`  Response:`, JSON.stringify(result.body, null, 2).substring(0, 300));
  console.log(`  Result: ${result.ok ? "PASS" : "FAIL"}`);
  return result.ok;
}

async function testGenFlexLocket(token: string, imagePath: string) {
  console.log("\n--- Testing genFlexLocket ---");
  const result = await callCallable("genFlexLocket", {
    inputImagePath: imagePath,
    vibeFilter: "natural",
  }, token);
  console.log(`  Status: ${result.status}`);
  console.log(`  Response:`, JSON.stringify(result.body, null, 2).substring(0, 500));

  if (result.ok && result.body?.result?.enhancementId) {
    console.log(`  enhancementId: ${result.body.result.enhancementId}`);
    console.log(`  outputImageUrl: ${result.body.result.outputImageUrl?.substring(0, 80)}...`);
    console.log(`  Result: PASS`);
  } else {
    console.log(`  Result: FAIL`);
    if (result.body?.error) {
      console.log(`  Error: ${result.body.error.message}`);
    }
  }
  return result.ok;
}

async function testGenFlexShot(token: string, imagePath: string) {
  console.log("\n--- Testing genFlexShot ---");
  const result = await callCallable("genFlexShot", {
    inputImagePath: imagePath,
    templateId: "t001",
  }, token);
  console.log(`  Status: ${result.status}`);
  console.log(`  Response:`, JSON.stringify(result.body, null, 2).substring(0, 500));

  if (result.ok && result.body?.result?.generationId) {
    console.log(`  generationId: ${result.body.result.generationId}`);
    console.log(`  Result: PASS`);
  } else {
    console.log(`  Result: FAIL`);
    if (result.body?.error) {
      console.log(`  Error: ${result.body.error.message}`);
    }
  }
  return result.ok;
}

async function testGenFlexTale(token: string, imagePath: string) {
  console.log("\n--- Testing genFlexTale ---");
  const result = await callCallable("genFlexTale", {
    inputImagePath: imagePath,
    storyId: "tale_paris_7days",
    selectedChapters: [1, 2], // Only generate 2 scenes for testing
  }, token);
  console.log(`  Status: ${result.status}`);
  console.log(`  Response:`, JSON.stringify(result.body, null, 2).substring(0, 500));

  if (result.ok && result.body?.result?.storyId) {
    console.log(`  storyId: ${result.body.result.storyId}`);
    console.log(`  totalScenes: ${result.body.result.totalScenes}`);
    console.log(`  Result: PASS`);
  } else {
    console.log(`  Result: FAIL`);
    if (result.body?.error) {
      console.log(`  Error: ${result.body.error.message}`);
    }
  }
  return result.ok;
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
async function main() {
  console.log(`\nFlexMe CF Test Suite (project: ${PROJECT_ID})`);
  console.log(`${"=".repeat(50)}\n`);

  const token = getAccessToken();
  console.log(`Got gcloud access token`);

  // The gcloud token is not a Firebase Auth ID token, so callable functions
  // may reject it for auth. We use it for direct HTTP call.
  // For proper testing, we need to use the app's auth flow.
  // For now, we'll use the gcloud token and see if the CF accepts it.

  const results: Record<string, boolean> = {};

  // Check existing test images in Storage
  let testImagePath: string;
  try {
    // Look for any existing uploaded image from the real user
    const bucket = `${PROJECT_ID}.firebasestorage.app`;
    const listUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o?prefix=uploads/&maxResults=5`;
    const listResp = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listData = await listResp.json() as any;

    if (listData.items && listData.items.length > 0) {
      testImagePath = listData.items[0].name;
      console.log(`Using existing image: ${testImagePath}`);
    } else {
      testImagePath = await ensureTestImage(token);
    }
  } catch (e) {
    console.error("Failed to find/upload test image:", e);
    testImagePath = await ensureTestImage(token);
  }

  // Run tests
  if (!onlyFunc || onlyFunc === "checkGeo") {
    results.checkGeo = await testCheckGeo(token);
  }

  if (!onlyFunc || onlyFunc === "genFlexLocket") {
    results.genFlexLocket = await testGenFlexLocket(token, testImagePath);
  }

  if (!onlyFunc || onlyFunc === "genFlexShot") {
    results.genFlexShot = await testGenFlexShot(token, testImagePath);
  }

  if (!onlyFunc || onlyFunc === "genFlexTale") {
    results.genFlexTale = await testGenFlexTale(token, testImagePath);
  }

  // Summary
  console.log(`\n${"=".repeat(50)}`);
  console.log("RESULTS:");
  for (const [name, passed] of Object.entries(results)) {
    console.log(`  ${passed ? "PASS" : "FAIL"} - ${name}`);
  }

  const allPassed = Object.values(results).every(Boolean);
  console.log(`\n${allPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED"}\n`);

  // Also check CF logs
  console.log("Checking CF logs for recent errors...\n");
  try {
    const logs = execSync(
      `firebase functions:log --only genFlexLocket,genFlexShot,genFlexTale,checkGeo 2>&1 | grep -E "(Starting|completed|failed|Error)" | tail -20`,
      { encoding: "utf8", timeout: 15000 }
    );
    console.log(logs);
  } catch {
    console.log("(Could not fetch CF logs)");
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
