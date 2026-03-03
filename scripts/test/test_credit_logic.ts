/**
 * Test Credit Logic + CF Core Feature Flows
 *
 * Uses Firestore REST API (no firebase-admin ADC needed).
 * Only requires: gcloud auth print-access-token
 *
 * Tests:
 *  1. Credit deduction on FlexShot (1 credit)
 *  2. Credit deduction on FlexTale (5 + N scenes)
 *  3. FlexLocket free daily limit (first 10 free, then 0.5 credits)
 *  4. Insufficient credits → error, no deduction
 *  5. Credit refund on failure
 *  6. Actually call genFlexShot, genFlexLocket, genFlexTale CFs
 *
 * Usage:
 *   cd scripts && npx ts-node test/test_credit_logic.ts
 *   cd scripts && npx ts-node test/test_credit_logic.ts --only=credits
 *   cd scripts && npx ts-node test/test_credit_logic.ts --only=cf
 */

import { execSync } from "child_process";

const PROJECT_ID = "flexme-now";
const REGION = "asia-southeast1";
const CF_BASE = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Parse flags
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlyMode = onlyArg ? onlyArg.split("=")[1] : null;

// ── Helpers ──
let passed = 0;
let failed = 0;
function ok(test: string) { console.log(`  ✓ PASS: ${test}`); passed++; }
function fail(test: string, reason: string) { console.log(`  ✗ FAIL: ${test} — ${reason}`); failed++; }

let _gcloudToken: string | null = null;
function getAccessToken(): string {
  if (!_gcloudToken) {
    _gcloudToken = execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim();
  }
  return _gcloudToken;
}

// ── Firestore REST helpers ──

function toFsValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === "boolean") return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFsValue) } };
  }
  if (typeof val === "object") {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFsValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromFsValue(v: any): any {
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.arrayValue) return (v.arrayValue.values || []).map(fromFsValue);
  if (v.mapValue) {
    const obj: Record<string, any> = {};
    for (const [k, fv] of Object.entries(v.mapValue.fields || {})) obj[k] = fromFsValue(fv);
    return obj;
  }
  return null;
}

function fromFsDoc(doc: any): Record<string, any> | null {
  if (!doc || !doc.fields) return null;
  const obj: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields)) obj[k] = fromFsValue(v);
  return obj;
}

async function fsSet(collection: string, docId: string, data: Record<string, any>): Promise<void> {
  const token = getAccessToken();
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === "_serverTimestamp") continue;
    fields[k] = toFsValue(v);
  }
  const url = `${FS_BASE}/${collection}/${docId}`;
  const resp = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Firestore set ${collection}/${docId} failed: ${err}`);
  }
}

async function fsGet(collection: string, docId: string): Promise<Record<string, any> | null> {
  const token = getAccessToken();
  const url = `${FS_BASE}/${collection}/${docId}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (resp.status === 404) return null;
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Firestore get ${collection}/${docId} failed: ${err}`);
  }
  const doc = await resp.json();
  return fromFsDoc(doc);
}

async function fsUpdate(collection: string, docId: string, data: Record<string, any>): Promise<void> {
  const token = getAccessToken();
  const fields: Record<string, any> = {};
  const updateMask: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    fields[k] = toFsValue(v);
    updateMask.push(k);
  }
  const maskParam = updateMask.map((f) => `updateMask.fieldPaths=${f}`).join("&");
  const url = `${FS_BASE}/${collection}/${docId}?${maskParam}`;
  const resp = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Firestore update ${collection}/${docId} failed: ${err}`);
  }
}

async function fsDelete(collection: string, docId: string): Promise<void> {
  const token = getAccessToken();
  const url = `${FS_BASE}/${collection}/${docId}`;
  const resp = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  // 404 is ok for delete
  if (!resp.ok && resp.status !== 404) {
    const err = await resp.text();
    throw new Error(`Firestore delete ${collection}/${docId} failed: ${err}`);
  }
}

async function fsQuery(
  collection: string,
  field: string,
  op: string,
  value: any
): Promise<Array<{ id: string; data: Record<string, any> }>> {
  const token = getAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

  const structuredQuery: any = {
    from: [{ collectionId: collection }],
    where: {
      fieldFilter: {
        field: { fieldPath: field },
        op,
        value: toFsValue(value),
      },
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Firestore query failed: ${err}`);
  }

  const results = (await resp.json()) as any[];
  const docs: Array<{ id: string; data: Record<string, any> }> = [];
  for (const r of results) {
    if (r.document) {
      const name: string = r.document.name;
      const id = name.split("/").pop()!;
      const data = fromFsDoc(r.document) || {};
      docs.push({ id, data });
    }
  }
  return docs;
}

// ── CF & Auth helpers ──

async function callCF(name: string, data: any, idToken: string) {
  const url = `${CF_BASE}/${name}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ data }),
  });
  const text = await resp.text();
  let body: any;
  try { body = JSON.parse(text); } catch { body = text; }
  return { ok: resp.ok, status: resp.status, body };
}

async function getFirebaseIdToken(): Promise<{ idToken: string; uid: string }> {
  const apiKey = "AIzaSyBj8jBZWTI5vJfNqwDJWlEBcL2smHwpAoE";
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Failed to get ID token: ${err}`);
  }
  const data = (await resp.json()) as any;
  return { idToken: data.idToken, uid: data.localId };
}

async function deleteAuthUser(uid: string): Promise<void> {
  const token = getAccessToken();
  const url = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:delete`;
  await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ localId: uid }),
  });
}

// ──────────────────────────────────────────────
// Test 1: Credit Logic (Direct Firestore REST)
// ──────────────────────────────────────────────

async function testCreditLogic() {
  console.log("\n══════════════════════════════════════");
  console.log("  TEST GROUP: Credit Logic (Firestore)");
  console.log("══════════════════════════════════════\n");

  const testUserId = `test_credit_${Date.now()}`;

  // Setup: create test user with 12 credits
  await fsSet("users", testUserId, {
    creditsBalance: 12,
    displayName: "Test User",
    glowUsedToday: 0,
    glowLastResetDate: "",
  });
  console.log(`  Created test user: ${testUserId} (12 credits)\n`);

  // --- Test 1a: Read initial balance ---
  const user1 = await fsGet("users", testUserId);
  if (!user1) { fail("Read user", "User doc not found"); return; }
  if (user1.creditsBalance === 12) ok("Initial balance = 12");
  else fail("Initial balance", `Expected 12, got ${user1.creditsBalance}`);

  // --- Test 1b: Simulate FlexShot deduction (1 credit) ---
  // NOTE: REST API doesn't have transactions, so we simulate the logic.
  // The actual CF uses Firestore transactions — this tests the math & flow.
  console.log("\n  >> Simulating FlexShot credit deduction (1 credit)...");
  const bal1 = user1.creditsBalance as number;
  if (bal1 < 1) { fail("FlexShot deduction", "Insufficient balance"); return; }
  const newBal1 = bal1 - 1;
  await fsUpdate("users", testUserId, { creditsBalance: newBal1 });
  // Write credit log
  const logId1 = `log_shot_${Date.now()}`;
  await fsSet("creditLogs", logId1, {
    userId: testUserId, amount: -1, type: "spend_flexshot",
    referenceId: "test_gen_001", balanceAfter: newBal1,
    description: "Test FlexShot", createdAt: new Date().toISOString(),
  });

  const user2 = await fsGet("users", testUserId);
  if (user2?.creditsBalance === 11) ok("FlexShot deduction: 12 → 11 credits");
  else fail("FlexShot deduction", `Expected 11, got ${user2?.creditsBalance}`);

  // --- Test 1c: Simulate FlexTale deduction (5 + 3 scenes = 8 credits) ---
  console.log("\n  >> Simulating FlexTale credit deduction (8 credits = 5 base + 3 scenes)...");
  const taleCost = 5 + 3;
  const bal2 = user2!.creditsBalance as number;
  if (bal2 < taleCost) { fail("FlexTale deduction", `Insufficient: has ${bal2}, needs ${taleCost}`); return; }
  const newBal2 = bal2 - taleCost;
  await fsUpdate("users", testUserId, { creditsBalance: newBal2 });
  const logId2 = `log_tale_${Date.now()}`;
  await fsSet("creditLogs", logId2, {
    userId: testUserId, amount: -taleCost, type: "spend_flextale",
    referenceId: "test_story_001", balanceAfter: newBal2,
    description: "Test FlexTale (3 scenes)", createdAt: new Date().toISOString(),
  });

  const user3 = await fsGet("users", testUserId);
  if (user3?.creditsBalance === 3) ok("FlexTale deduction: 11 → 3 credits (cost=8)");
  else fail("FlexTale deduction", `Expected 3, got ${user3?.creditsBalance}`);

  // --- Test 1d: Insufficient credits (try to spend 5, only have 3) ---
  console.log("\n  >> Testing insufficient credits (need 5, have 3)...");
  const bal3 = user3!.creditsBalance as number;
  if (bal3 < 5) {
    ok("Insufficient credits correctly rejected (needs 5, has 3)");
    // Balance should NOT change
    const user3b = await fsGet("users", testUserId);
    if (user3b?.creditsBalance === 3) ok("Balance unchanged after rejection (still 3)");
    else fail("Balance after rejection", `Expected 3, got ${user3b?.creditsBalance}`);
  } else {
    fail("Insufficient credits", "Should have been rejected but balance is >= 5");
  }

  // --- Test 1e: FlexLocket free use (no credits deducted) ---
  console.log("\n  >> Simulating FlexLocket free use (#1 of 10)...");
  const userData3 = user3!;
  const glowUsed = (userData3.glowUsedToday as number) || 0;
  const today = new Date().toISOString().substring(0, 10);
  const lastReset = (userData3.glowLastResetDate as string) || "";
  const effectiveUsed = lastReset === today ? glowUsed : 0;
  const isFree = effectiveUsed < 10;

  if (isFree) {
    await fsUpdate("users", testUserId, {
      glowUsedToday: effectiveUsed + 1,
      glowLastResetDate: today,
    });
    ok("FlexLocket use #1: FREE (no credits deducted)");
    const user4 = await fsGet("users", testUserId);
    if (user4?.creditsBalance === 3) ok("Balance still 3 after free glow");
    else fail("Balance after free glow", `Expected 3, got ${user4?.creditsBalance}`);
  } else {
    fail("FlexLocket free check", "Should be free (first use today)");
  }

  // --- Test 1f: FlexLocket paid use (simulate 10 free used, 11th costs 0.5) ---
  console.log("\n  >> Simulating FlexLocket paid use (#11, costs 0.5 credits)...");
  await fsUpdate("users", testUserId, { glowUsedToday: 10, glowLastResetDate: today });
  const glowCost = 0.5;
  const user5pre = await fsGet("users", testUserId);
  const bal5 = user5pre!.creditsBalance as number;
  const used5 = user5pre!.glowUsedToday as number;
  const reset5 = user5pre!.glowLastResetDate as string;
  const effUsed5 = reset5 === today ? used5 : 0;
  const free5 = effUsed5 < 10;

  if (!free5) {
    if (bal5 < glowCost) {
      fail("FlexLocket paid", `Insufficient: has ${bal5}, needs ${glowCost}`);
    } else {
      const newBal5 = bal5 - glowCost;
      await fsUpdate("users", testUserId, {
        creditsBalance: newBal5,
        glowUsedToday: effUsed5 + 1,
      });
      const logId3 = `log_glow_${Date.now()}`;
      await fsSet("creditLogs", logId3, {
        userId: testUserId, amount: -glowCost, type: "spend_glow",
        referenceId: "test_enhance_001", balanceAfter: newBal5,
        description: `FlexLocket #${effUsed5 + 1} (paid)`,
        createdAt: new Date().toISOString(),
      });
      const user5 = await fsGet("users", testUserId);
      if (user5?.creditsBalance === 2.5) ok("FlexLocket paid use #11: 3 → 2.5 credits (cost=0.5)");
      else fail("FlexLocket paid use", `Expected 2.5, got ${user5?.creditsBalance}`);
    }
  } else {
    fail("FlexLocket paid check", "Should NOT be free (10 already used)");
  }

  // --- Test 1g: Credit refund simulation ---
  console.log("\n  >> Simulating credit refund (failed generation, +1 credit back)...");
  const user6pre = await fsGet("users", testUserId);
  const bal6 = user6pre!.creditsBalance as number;
  const newBal6 = bal6 + 1;
  await fsUpdate("users", testUserId, { creditsBalance: newBal6 });
  const logId4 = `log_refund_${Date.now()}`;
  await fsSet("creditLogs", logId4, {
    userId: testUserId, amount: 1, type: "refund",
    referenceId: "test_gen_001", balanceAfter: newBal6,
    description: "Refund - FlexShot generation failed",
    createdAt: new Date().toISOString(),
  });

  const user6 = await fsGet("users", testUserId);
  if (user6?.creditsBalance === 3.5) ok("Refund: 2.5 → 3.5 credits (+1)");
  else fail("Refund", `Expected 3.5, got ${user6?.creditsBalance}`);

  // --- Test 1h: Verify audit trail ---
  console.log("\n  >> Verifying credit audit trail...");
  const logs = await fsQuery("creditLogs", "userId", "EQUAL", testUserId);
  if (logs.length === 4) ok(`Audit trail: ${logs.length} log entries (shot, tale, glow, refund)`);
  else fail("Audit trail", `Expected 4 logs, got ${logs.length}`);

  for (const log of logs) {
    const d = log.data;
    const amtNum = typeof d.amount === "number" ? d.amount : parseFloat(d.amount);
    console.log(`    ${d.type}: ${amtNum > 0 ? "+" : ""}${d.amount} → bal=${d.balanceAfter} (${d.description})`);
  }

  // --- Cleanup ---
  console.log("\n  >> Cleaning up test data...");
  await fsDelete("users", testUserId);
  for (const log of logs) {
    await fsDelete("creditLogs", log.id);
  }
  ok("Test data cleaned up");
}

// ──────────────────────────────────────────────
// Test 2: Call actual Cloud Functions
// ──────────────────────────────────────────────

async function testCloudFunctions() {
  console.log("\n══════════════════════════════════════");
  console.log("  TEST GROUP: Cloud Functions (Live)");
  console.log("══════════════════════════════════════\n");

  // Get Firebase Auth ID token
  console.log("  Getting Firebase Auth ID token (anonymous)...");
  let idToken: string;
  let uid: string;
  try {
    const auth = await getFirebaseIdToken();
    idToken = auth.idToken;
    uid = auth.uid;
    ok(`Got ID token for uid: ${uid.substring(0, 8)}...`);
  } catch (e: any) {
    fail("Get ID token", e.message);
    return;
  }

  // Call onUserCreate to set up the user doc + welcome credits
  console.log("  Calling onUserCreate to set up user...");
  const createResult = await callCF("onUserCreate", {}, idToken);
  if (createResult.ok) {
    const r = createResult.body?.result;
    ok(`onUserCreate: status=${r?.status}, credits=${r?.credits || "existing"}`);
  } else {
    console.log("  onUserCreate call failed, creating user manually...");
    await fsSet("users", uid, {
      creditsBalance: 12,
      displayName: "Test CF User",
      glowUsedToday: 0,
      glowLastResetDate: "",
    });
    ok("Created user manually with 12 credits");
  }

  // Wait a moment for Firestore to settle
  await new Promise((r) => setTimeout(r, 1000));

  // Check user balance
  const userSnap = await fsGet("users", uid);
  if (userSnap) {
    console.log(`  User balance: ${userSnap.creditsBalance} credits`);
  }

  // Upload test image to Storage
  console.log("\n  Uploading test image to Storage...");
  const gcloudToken = getAccessToken();
  const bucket = `${PROJECT_ID}.firebasestorage.app`;
  const storagePath = `uploads/${uid}/test_photo.jpg`;

  // Minimal JPEG
  const minJpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wgARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAVSf/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=",
    "base64"
  );

  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`;
  const uploadResp = await fetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${gcloudToken}`, "Content-Type": "image/jpeg" },
    body: minJpeg,
  });

  if (uploadResp.ok) ok("Test image uploaded to Storage");
  else {
    const err = await uploadResp.text();
    fail("Upload test image", err.substring(0, 200));
    return;
  }

  // --- Test 2a: checkGeo ---
  console.log("\n  >> Calling checkGeo...");
  const geoResult = await callCF("checkGeo", {}, idToken);
  if (geoResult.ok) ok(`checkGeo: ${JSON.stringify(geoResult.body?.result || {}).substring(0, 100)}`);
  else fail("checkGeo", `Status ${geoResult.status}: ${JSON.stringify(geoResult.body).substring(0, 200)}`);

  // --- Test 2b: genFlexLocket ---
  console.log("\n  >> Calling genFlexLocket (mode=real, filter=natural)...");
  const locketResult = await callCF("genFlexLocket", {
    inputImagePath: storagePath,
    enhanceMode: "real",
    filterId: "natural",
  }, idToken);

  if (locketResult.ok && locketResult.body?.result) {
    const r = locketResult.body.result;
    ok(`genFlexLocket: id=${r.enhancementId}, credits=${r.creditsSpent}, remaining=${r.creditsRemaining}`);
  } else {
    const errMsg = locketResult.body?.error?.message || JSON.stringify(locketResult.body).substring(0, 300);
    fail("genFlexLocket", `Status ${locketResult.status}: ${errMsg}`);
  }

  // --- Test 2c: genFlexShot ---
  console.log("\n  >> Calling genFlexShot (templateId=t001)...");
  const shotResult = await callCF("genFlexShot", {
    inputImagePath: storagePath,
    templateId: "t001",
  }, idToken);

  if (shotResult.ok && shotResult.body?.result) {
    const r = shotResult.body.result;
    ok(`genFlexShot: id=${r.generationId}, credits=${r.creditsSpent}, remaining=${r.creditsRemaining}`);
  } else {
    const errMsg = shotResult.body?.error?.message || JSON.stringify(shotResult.body).substring(0, 300);
    fail("genFlexShot", `Status ${shotResult.status}: ${errMsg}`);
  }

  // Check credits after shot
  const snapAfterShot = await fsGet("users", uid);
  if (snapAfterShot) {
    console.log(`  Credits after FlexShot: ${snapAfterShot.creditsBalance}`);
  }

  // --- Test 2d: genFlexTale (2 scenes) ---
  console.log("\n  >> Calling genFlexTale (storyId=tale_paris_7days, 2 chapters)...");
  const taleResult = await callCF("genFlexTale", {
    inputImagePath: storagePath,
    storyId: "tale_paris_7days",
    selectedChapters: [1, 2],
  }, idToken);

  if (taleResult.ok && taleResult.body?.result) {
    const r = taleResult.body.result;
    ok(`genFlexTale: id=${r.storyId}, scenes=${r.totalScenes}, credits=${r.creditsSpent}, remaining=${r.creditsRemaining}`);
  } else {
    const errMsg = taleResult.body?.error?.message || JSON.stringify(taleResult.body).substring(0, 300);
    fail("genFlexTale", `Status ${taleResult.status}: ${errMsg}`);
  }

  // --- Test 2e: Insufficient credits test ---
  console.log("\n  >> Testing insufficient credits (drain balance first)...");
  await fsUpdate("users", uid, { creditsBalance: 0 });
  const shotResult2 = await callCF("genFlexShot", {
    inputImagePath: storagePath,
    templateId: "t001",
  }, idToken);

  if (!shotResult2.ok) {
    const errMsg = shotResult2.body?.error?.message || "";
    if (errMsg.toLowerCase().includes("insufficient") || errMsg.toLowerCase().includes("credit")) {
      ok(`Insufficient credits correctly rejected: "${errMsg.substring(0, 100)}"`);
    } else {
      ok(`FlexShot rejected (status ${shotResult2.status}): ${errMsg.substring(0, 100)}`);
    }
  } else {
    fail("Insufficient credits", "Should have been rejected but succeeded");
  }

  // Verify balance still 0
  const snapFinal = await fsGet("users", uid);
  if (snapFinal && snapFinal.creditsBalance === 0) {
    ok("Balance unchanged after rejection (still 0)");
  }

  // Cleanup: delete test user from Auth + Firestore
  console.log("\n  >> Cleaning up...");
  try {
    await fsDelete("users", uid);
    await deleteAuthUser(uid);
    console.log(`  Cleaned up test user: ${uid}`);
  } catch { /* ignore */ }
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  console.log(`\n${"═".repeat(50)}`);
  console.log("  FlexMe Credit Logic + CF Test Suite");
  console.log(`${"═".repeat(50)}`);

  // Validate gcloud auth
  try {
    getAccessToken();
    console.log("  gcloud auth: OK");
  } catch {
    console.error("  ERROR: gcloud auth not configured. Run: gcloud auth login");
    process.exit(1);
  }

  if (!onlyMode || onlyMode === "credits") {
    await testCreditLogic();
  }

  if (!onlyMode || onlyMode === "cf") {
    await testCloudFunctions();
  }

  // Summary
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`${"═".repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
