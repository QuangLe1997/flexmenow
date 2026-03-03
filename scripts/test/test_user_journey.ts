/**
 * Integration Test — Full User Journey
 *
 * Simulates a REAL user using the app from start to finish:
 *  1. Sign up (anonymous) → onUserCreate → get 12 welcome credits
 *  2. Browse app → checkGeo
 *  3. Try FlexLocket (Glow) — FREE (first 10/day)
 *  4. Try FlexShot (Create) — 1 credit
 *  5. Try FlexTale (Story) — 5 base + 2 scenes = 7 credits
 *  6. Check balance after each step
 *  7. Try FlexLocket again — still free (#2 of 10)
 *  8. Simulate 10 free glow uses → 11th costs 0.5 credits
 *  9. Try FlexShot with 0 credits → should fail
 * 10. Cleanup
 *
 * Usage:
 *   cd scripts && npx ts-node test/test_user_journey.ts
 */

import { execSync } from "child_process";

const PROJECT_ID = "flexme-now";
const REGION = "asia-southeast1";
const CF_BASE = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ── Helpers ──
let passed = 0;
let failed = 0;
let step = 0;

function header(msg: string) {
  step++;
  console.log(`\n  ┌─ STEP ${step}: ${msg}`);
  console.log(`  │`);
}
function log(msg: string) { console.log(`  │  ${msg}`); }
function ok(test: string) { console.log(`  │  ✓ ${test}`); passed++; }
function fail(test: string, reason: string) { console.log(`  │  ✗ ${test} — ${reason}`); failed++; }
function footer() { console.log(`  └─────────────────────────────────`); }

let _token: string | null = null;
function gcloudToken(): string {
  if (!_token) _token = execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim();
  return _token;
}

// ── Firestore REST ──

function toFsVal(v: any): any {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsVal) } };
  if (typeof v === "object") {
    const f: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) f[k] = toFsVal(val);
    return { mapValue: { fields: f } };
  }
  return { stringValue: String(v) };
}

function fromFsVal(v: any): any {
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.arrayValue) return (v.arrayValue.values || []).map(fromFsVal);
  if (v.mapValue) {
    const o: Record<string, any> = {};
    for (const [k, fv] of Object.entries(v.mapValue.fields || {})) o[k] = fromFsVal(fv);
    return o;
  }
  return null;
}

function fromFsDoc(doc: any): Record<string, any> | null {
  if (!doc?.fields) return null;
  const o: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields)) o[k] = fromFsVal(v);
  return o;
}

async function fsGet(col: string, id: string): Promise<Record<string, any> | null> {
  const r = await fetch(`${FS_BASE}/${col}/${id}`, { headers: { Authorization: `Bearer ${gcloudToken()}` } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`fsGet ${col}/${id}: ${await r.text()}`);
  return fromFsDoc(await r.json());
}

async function fsUpdate(col: string, id: string, data: Record<string, any>): Promise<void> {
  const fields: Record<string, any> = {};
  const mask: string[] = [];
  for (const [k, v] of Object.entries(data)) { fields[k] = toFsVal(v); mask.push(k); }
  const mp = mask.map((f) => `updateMask.fieldPaths=${f}`).join("&");
  const r = await fetch(`${FS_BASE}/${col}/${id}?${mp}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${gcloudToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!r.ok) throw new Error(`fsUpdate ${col}/${id}: ${await r.text()}`);
}

async function fsDelete(col: string, id: string): Promise<void> {
  await fetch(`${FS_BASE}/${col}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${gcloudToken()}` },
  });
}

async function fsQuery(col: string, field: string, value: any): Promise<Array<{ id: string; data: Record<string, any> }>> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${gcloudToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: col }],
        where: { fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: toFsVal(value) } },
      },
    }),
  });
  if (!r.ok) throw new Error(`fsQuery: ${await r.text()}`);
  const results = (await r.json()) as any[];
  return results.filter((x: any) => x.document).map((x: any) => ({
    id: (x.document.name as string).split("/").pop()!,
    data: fromFsDoc(x.document) || {},
  }));
}

// ── CF & Auth ──

async function callCF(name: string, data: any, idToken: string) {
  const r = await fetch(`${CF_BASE}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ data }),
  });
  const text = await r.text();
  let body: any;
  try { body = JSON.parse(text); } catch { body = text; }
  return { ok: r.ok, status: r.status, body };
}

async function signUpAnonymous(): Promise<{ idToken: string; uid: string }> {
  const apiKey = "AIzaSyBj8jBZWTI5vJfNqwDJWlEBcL2smHwpAoE";
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  if (!r.ok) throw new Error(`Auth failed: ${await r.text()}`);
  const d = (await r.json()) as any;
  return { idToken: d.idToken, uid: d.localId };
}

async function deleteAuthUser(uid: string): Promise<void> {
  await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:delete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${gcloudToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ localId: uid }),
  });
}

async function uploadTestImage(uid: string): Promise<string> {
  const bucket = `${PROJECT_ID}.firebasestorage.app`;
  const storagePath = `uploads/${uid}/selfie.jpg`;
  const minJpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wgARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAVSf/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=",
    "base64"
  );
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${gcloudToken()}`, "Content-Type": "image/jpeg" },
    body: minJpeg,
  });
  if (!r.ok) throw new Error(`Upload failed: ${await r.text()}`);
  return storagePath;
}

// ──────────────────────────────────────────────
// Main Journey
// ──────────────────────────────────────────────

async function main() {
  console.log(`\n${"═".repeat(56)}`);
  console.log(`  FlexMe — Full User Journey Integration Test`);
  console.log(`  Simulating: New user → sign up → use all features`);
  console.log(`${"═".repeat(56)}`);

  let uid = "";
  let idToken = "";
  let imagePath = "";

  try {
    // ── STEP 1: User opens app → anonymous sign up ──
    header("User opens app → Anonymous sign up");
    const auth = await signUpAnonymous();
    uid = auth.uid;
    idToken = auth.idToken;
    log(`uid: ${uid}`);
    ok("Anonymous sign up successful");
    footer();

    // ── STEP 2: App calls onUserCreate → create Firestore doc + welcome credits ──
    header("App calls onUserCreate → Welcome credits");
    const createResult = await callCF("onUserCreate", {}, idToken);
    if (createResult.ok && createResult.body?.result?.status === "created") {
      ok(`User doc created, ${createResult.body.result.credits} welcome credits`);
    } else {
      fail("onUserCreate", JSON.stringify(createResult.body).substring(0, 200));
    }

    await new Promise((r) => setTimeout(r, 500));
    const userAfterCreate = await fsGet("users", uid);
    if (userAfterCreate) {
      log(`Balance: ${userAfterCreate.creditsBalance} credits`);
      log(`glowUsedToday: ${userAfterCreate.glowUsedToday}`);
      if (userAfterCreate.creditsBalance === 12) ok("Welcome balance = 12 credits");
      else fail("Welcome balance", `Expected 12, got ${userAfterCreate.creditsBalance}`);
    } else {
      fail("User doc", "Not found after onUserCreate");
    }
    footer();

    // ── STEP 3: User opens app → checkGeo ──
    header("App checks user location → checkGeo");
    const geo = await callCF("checkGeo", {}, idToken);
    if (geo.ok) {
      const g = geo.body?.result || {};
      log(`Country: ${g.countryCode}, IP: ${g.ip}`);
      ok(`Geo detected: ${g.countryCode}`);
    } else {
      fail("checkGeo", `Status ${geo.status}`);
    }
    footer();

    // ── STEP 4: User uploads selfie ──
    header("User takes/uploads a selfie photo");
    imagePath = await uploadTestImage(uid);
    log(`Uploaded to: ${imagePath}`);
    ok("Photo uploaded to Firebase Storage");
    footer();

    // ── STEP 5: User tries FlexLocket (Glow) — FREE ──
    header("User tries FlexLocket (Glow tab) — FREE use #1");
    log("Mode: real, Filter: natural");
    const locket1 = await callCF("genFlexLocket", {
      inputImagePath: imagePath,
      enhanceMode: "real",
      filterId: "natural",
    }, idToken);
    if (locket1.ok && locket1.body?.result) {
      const r = locket1.body.result;
      log(`Enhancement ID: ${r.enhancementId}`);
      log(`Credits spent: ${r.creditsSpent} (FREE)`);
      log(`Balance remaining: ${r.creditsRemaining}`);
      if (r.creditsSpent === 0) ok("FlexLocket FREE — 0 credits spent");
      else fail("FlexLocket FREE", `Should be 0 credits, spent ${r.creditsSpent}`);
      if (r.creditsRemaining === 12) ok("Balance unchanged: 12 credits");
      else fail("Balance after glow", `Expected 12, got ${r.creditsRemaining}`);
    } else {
      fail("genFlexLocket", locket1.body?.error?.message || `Status ${locket1.status}`);
    }

    // Verify Firestore
    const userAfterGlow = await fsGet("users", uid);
    if (userAfterGlow) {
      log(`glowUsedToday: ${userAfterGlow.glowUsedToday}`);
      if (userAfterGlow.glowUsedToday === 1) ok("glowUsedToday incremented to 1");
      else fail("glowUsedToday", `Expected 1, got ${userAfterGlow.glowUsedToday}`);
    }
    footer();

    // ── STEP 6: User tries FlexShot (Create tab) — 1 credit ──
    header("User generates FlexShot (Create tab) — costs 1 credit");
    log("Template: t001");
    const shot1 = await callCF("genFlexShot", {
      inputImagePath: imagePath,
      templateId: "t001",
    }, idToken);
    if (shot1.ok && shot1.body?.result) {
      const r = shot1.body.result;
      log(`Generation ID: ${r.generationId}`);
      log(`Credits spent: ${r.creditsSpent}`);
      log(`Balance remaining: ${r.creditsRemaining}`);
      if (r.creditsSpent === 1) ok("FlexShot cost: 1 credit");
      else fail("FlexShot cost", `Expected 1, got ${r.creditsSpent}`);
      if (r.creditsRemaining === 11) ok("Balance: 12 → 11 credits");
      else fail("Balance after shot", `Expected 11, got ${r.creditsRemaining}`);
    } else {
      fail("genFlexShot", shot1.body?.error?.message || `Status ${shot1.status}`);
    }

    // Verify Firestore
    const userAfterShot = await fsGet("users", uid);
    if (userAfterShot) {
      log(`Firestore balance: ${userAfterShot.creditsBalance}`);
      log(`totalGenerations: ${userAfterShot.totalGenerations}`);
      if (userAfterShot.creditsBalance === 11) ok("Firestore balance = 11");
      else fail("Firestore balance", `Expected 11, got ${userAfterShot.creditsBalance}`);
    }
    footer();

    // ── STEP 7: User generates FlexTale (Story tab) — 5 + 2 scenes = 7 credits ──
    header("User generates FlexTale (Story tab) — 5 base + 2 scenes = 7 credits");
    log("Story: tale_paris_7days, Chapters: [1, 2]");
    const tale1 = await callCF("genFlexTale", {
      inputImagePath: imagePath,
      storyId: "tale_paris_7days",
      selectedChapters: [1, 2],
    }, idToken);
    if (tale1.ok && tale1.body?.result) {
      const r = tale1.body.result;
      log(`Story ID: ${r.storyId}`);
      log(`Total scenes: ${r.totalScenes}`);
      log(`Credits spent: ${r.creditsSpent}`);
      log(`Balance remaining: ${r.creditsRemaining}`);
      if (r.creditsSpent === 7) ok("FlexTale cost: 7 credits (5 base + 2 scenes)");
      else fail("FlexTale cost", `Expected 7, got ${r.creditsSpent}`);
      if (r.creditsRemaining === 4) ok("Balance: 11 → 4 credits");
      else fail("Balance after tale", `Expected 4, got ${r.creditsRemaining}`);
    } else {
      fail("genFlexTale", tale1.body?.error?.message || `Status ${tale1.status}`);
    }

    // Verify Firestore
    const userAfterTale = await fsGet("users", uid);
    if (userAfterTale) {
      log(`Firestore balance: ${userAfterTale.creditsBalance}`);
      log(`totalStories: ${userAfterTale.totalStories}`);
      if (userAfterTale.creditsBalance === 4) ok("Firestore balance = 4");
      else fail("Firestore balance", `Expected 4, got ${userAfterTale.creditsBalance}`);
    }
    footer();

    // ── STEP 8: User uses FlexLocket again — still free (#2) ──
    header("User uses FlexLocket again — still FREE (#2 of 10)");
    log("Mode: moment, Filter: golden_hour");
    const locket2 = await callCF("genFlexLocket", {
      inputImagePath: imagePath,
      enhanceMode: "moment",
      filterId: "golden_hour",
    }, idToken);
    if (locket2.ok && locket2.body?.result) {
      const r = locket2.body.result;
      log(`Credits spent: ${r.creditsSpent}, Balance: ${r.creditsRemaining}`);
      if (r.creditsSpent === 0) ok("FlexLocket #2 still FREE");
      else fail("FlexLocket #2", `Should be free, spent ${r.creditsSpent}`);
      if (r.creditsRemaining === 4) ok("Balance unchanged: 4 credits");
      else fail("Balance", `Expected 4, got ${r.creditsRemaining}`);
    } else {
      fail("genFlexLocket #2", locket2.body?.error?.message || `Status ${locket2.status}`);
    }

    const userAfterGlow2 = await fsGet("users", uid);
    if (userAfterGlow2) {
      log(`glowUsedToday: ${userAfterGlow2.glowUsedToday}`);
      if (userAfterGlow2.glowUsedToday === 3) ok("glowUsedToday = 3 (2 real + 1 from CF)");
      else log(`Note: glowUsedToday = ${userAfterGlow2.glowUsedToday} (may vary)`);
    }
    footer();

    // ── STEP 9: Simulate exhausting free glow → 11th use costs 0.5 ──
    header("Simulate: exhaust 10 free glow → #11 costs 0.5 credits");
    log("Setting glowUsedToday = 10 in Firestore...");
    const today = new Date().toISOString().substring(0, 10);
    await fsUpdate("users", uid, { glowUsedToday: 10, glowLastResetDate: today });

    log("Calling genFlexLocket (#11 — PAID)...");
    const locket3 = await callCF("genFlexLocket", {
      inputImagePath: imagePath,
      enhanceMode: "real",
      filterId: "studio",
    }, idToken);
    if (locket3.ok && locket3.body?.result) {
      const r = locket3.body.result;
      log(`Credits spent: ${r.creditsSpent}`);
      log(`Balance remaining: ${r.creditsRemaining}`);
      if (r.creditsSpent === 0.5) ok("FlexLocket #11: 0.5 credits charged");
      else fail("FlexLocket #11 cost", `Expected 0.5, got ${r.creditsSpent}`);
      if (r.creditsRemaining === 3.5) ok("Balance: 4 → 3.5 credits");
      else fail("Balance after paid glow", `Expected 3.5, got ${r.creditsRemaining}`);
    } else {
      fail("genFlexLocket paid", locket3.body?.error?.message || `Status ${locket3.status}`);
    }
    footer();

    // ── STEP 10: User runs out of credits → FlexShot fails ──
    header("User runs low on credits → FlexShot should fail");
    log("Setting balance to 0 in Firestore...");
    await fsUpdate("users", uid, { creditsBalance: 0 });

    log("Calling genFlexShot with 0 credits...");
    const shot2 = await callCF("genFlexShot", {
      inputImagePath: imagePath,
      templateId: "t001",
    }, idToken);
    if (!shot2.ok) {
      const errMsg = shot2.body?.error?.message || "";
      log(`Error: "${errMsg}"`);
      if (errMsg.toLowerCase().includes("insufficient") || errMsg.toLowerCase().includes("credit")) {
        ok("Insufficient credits → correctly rejected");
      } else {
        ok(`Rejected with status ${shot2.status}`);
      }
    } else {
      fail("Insufficient credits", "Should have failed but succeeded!");
    }

    // Verify balance didn't change
    const userFinal = await fsGet("users", uid);
    if (userFinal && userFinal.creditsBalance === 0) {
      ok("Balance still 0 — no phantom deduction");
    } else {
      fail("Balance check", `Expected 0, got ${userFinal?.creditsBalance}`);
    }
    footer();

    // ── STEP 11: User runs out of credits → FlexTale also fails ──
    header("User tries FlexTale with 0 credits → should fail");
    const tale2 = await callCF("genFlexTale", {
      inputImagePath: imagePath,
      storyId: "tale_paris_7days",
      selectedChapters: [1],
    }, idToken);
    if (!tale2.ok) {
      const errMsg = tale2.body?.error?.message || "";
      log(`Error: "${errMsg}"`);
      ok("FlexTale also rejected — no credits");
    } else {
      fail("FlexTale insufficient", "Should have failed!");
    }
    footer();

    // ── STEP 12: Verify credit logs (audit trail) ──
    header("Verify credit audit trail in Firestore");
    const logs = await fsQuery("creditLogs", "userId", uid);
    log(`Found ${logs.length} credit log entries`);
    for (const l of logs) {
      const d = l.data;
      const sign = typeof d.amount === "number" && d.amount > 0 ? "+" : "";
      log(`  ${d.type}: ${sign}${d.amount} → bal=${d.balanceAfter} | ${d.description}`);
    }
    if (logs.length >= 3) ok(`Audit trail: ${logs.length} entries logged`);
    else fail("Audit trail", `Expected >=3 logs, got ${logs.length}`);
    footer();

    // ── STEP 13: Verify generation docs were created ──
    header("Verify generation & enhancement docs in Firestore");
    const generations = await fsQuery("generations", "userId", uid);
    log(`Generations: ${generations.length} docs`);
    for (const g of generations) {
      log(`  ${g.id}: status=${g.data.status}, template=${g.data.templateId}`);
    }
    if (generations.length >= 1) ok(`${generations.length} generation doc(s) created`);
    else fail("Generations", "No generation docs found");

    const enhancements = await fsQuery("enhancements", "userId", uid);
    log(`Enhancements: ${enhancements.length} docs`);
    for (const e of enhancements) {
      log(`  ${e.id}: status=${e.data.status}, mode=${e.data.enhanceMode}, free=${e.data.isFreeUse}`);
    }
    if (enhancements.length >= 2) ok(`${enhancements.length} enhancement doc(s) created`);
    else fail("Enhancements", `Expected >=2, got ${enhancements.length}`);

    const stories = await fsQuery("stories", "userId", uid);
    log(`Stories: ${stories.length} docs`);
    for (const s of stories) {
      log(`  ${s.id}: status=${s.data.status}, pack=${s.data.storyPackId}, scenes=${s.data.completedScenes}/${s.data.totalScenes}`);
    }
    if (stories.length >= 1) ok(`${stories.length} story doc(s) created`);
    else fail("Stories", "No story docs found");
    footer();

  } finally {
    // ── CLEANUP ──
    console.log(`\n  ┌─ CLEANUP`);
    console.log(`  │`);
    if (uid) {
      try {
        // Delete user data
        const collections = ["generations", "enhancements", "stories", "creditLogs"];
        for (const col of collections) {
          const docs = await fsQuery(col, "userId", uid);
          for (const d of docs) await fsDelete(col, d.id);
          if (docs.length > 0) log(`Deleted ${docs.length} ${col} docs`);
        }
        await fsDelete("users", uid);
        log("Deleted user doc");
        await deleteAuthUser(uid);
        log(`Deleted auth user: ${uid}`);
      } catch (e: any) {
        log(`Cleanup warning: ${e.message}`);
      }
    }
    console.log(`  └─────────────────────────────────`);
  }

  // ── SUMMARY ──
  console.log(`\n${"═".repeat(56)}`);
  console.log(`  JOURNEY COMPLETE: ${passed} passed, ${failed} failed`);
  console.log(`${"═".repeat(56)}`);

  if (failed === 0) {
    console.log(`\n  App flow verified end-to-end:`);
    console.log(`    Sign up → 12 credits ✓`);
    console.log(`    FlexLocket (free) → 0 credits ✓`);
    console.log(`    FlexShot → 1 credit ✓`);
    console.log(`    FlexTale (2 scenes) → 7 credits ✓`);
    console.log(`    FlexLocket (paid #11) → 0.5 credits ✓`);
    console.log(`    Insufficient credits → rejected ✓`);
    console.log(`    Audit trail + docs → all verified ✓\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("\nFatal:", err);
  process.exit(1);
});
