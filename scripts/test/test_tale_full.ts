/**
 * Test genFlexTale — FULL 9 chapters (tale_paris_7days)
 *
 * Cost: 5 base + 9 scenes = 14 credits
 * Strategy: Fire CF call via curl (no timeout), then poll Firestore for results.
 *
 * Usage: cd scripts && npx ts-node test/test_tale_full.ts
 */

import "dotenv/config";
import { execSync, spawn } from "child_process";

const PROJECT_ID = "flexme-now";
const REGION = "asia-southeast1";
const CF_BASE = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const gcloudToken = execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim();

// ── Firestore helpers ──

function fromFsVal(v: any): any {
  if (!v || typeof v !== "object") return null;
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

async function fsGetDoc(path: string): Promise<Record<string, any> | null> {
  const r = await fetch(`${FS_BASE}/${path}`, { headers: { Authorization: `Bearer ${gcloudToken}` } });
  if (!r.ok) return null;
  const doc = (await r.json()) as any;
  if (!doc?.fields) return null;
  const o: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields)) o[k] = fromFsVal(v);
  return o;
}

async function fsUpdate(col: string, id: string, data: Record<string, any>) {
  const fields: Record<string, any> = {};
  const mask: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    mask.push(k);
    if (typeof v === "number") fields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    else if (typeof v === "string") fields[k] = { stringValue: v };
    else if (typeof v === "boolean") fields[k] = { booleanValue: v };
    else fields[k] = { nullValue: null };
  }
  const mp = mask.map((f) => `updateMask.fieldPaths=${f}`).join("&");
  await fetch(`${FS_BASE}/${col}/${id}?${mp}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${gcloudToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
}

async function fsQuery(col: string, field: string, value: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${gcloudToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: col }],
        where: { fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: { stringValue: value } } },
      },
    }),
  });
  const results = (await r.json()) as any[];
  return results.filter((x: any) => x.document).map((x: any) => {
    const name: string = x.document.name;
    const o: Record<string, any> = {};
    for (const [k, v] of Object.entries(x.document.fields || {})) o[k] = fromFsVal(v);
    return { id: name.split("/").pop()!, data: o };
  });
}

// ── Auth ──

async function signUp() {
  const apiKey = process.env.FIREBASE_API_KEY || "";
  if (!apiKey) throw new Error("FIREBASE_API_KEY env var not set");
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  const d = (await r.json()) as any;
  return { idToken: d.idToken as string, uid: d.localId as string };
}

// ── Call CF via curl (no timeout) ──

function callCFviaCurl(name: string, data: any, idToken: string): { ok: boolean; body: any } {
  const url = `${CF_BASE}/${name}`;
  const payload = JSON.stringify({ data });

  // Write payload to temp file to avoid shell escaping issues on Windows
  const fs = require("fs");
  const tmpFile = `/tmp/cf_payload_${Date.now()}.json`;
  fs.writeFileSync(tmpFile, payload);

  try {
    const result = execSync(
      `curl -s -w "\\n%{http_code}" --max-time 600 -X POST "${url}" -H "Content-Type: application/json" -H "Authorization: Bearer ${idToken}" -d @${tmpFile}`,
      { encoding: "utf8", timeout: 620_000, maxBuffer: 10 * 1024 * 1024 }
    );
    const lines = result.trim().split("\n");
    const statusCode = parseInt(lines.pop()!, 10);
    const bodyText = lines.join("\n");
    let body: any;
    try { body = JSON.parse(bodyText); } catch { body = bodyText; }
    return { ok: statusCode >= 200 && statusCode < 300, body };
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

// ── Main ──

async function main() {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  FlexTale Full Story Test — Paris 7 Days (9 scenes)`);
  console.log(`  Cost: 5 base + 9 × 1 = 14 credits`);
  console.log(`  CF timeout: 600s, inter-scene delay: 4s`);
  console.log(`${"═".repeat(60)}`);

  // 1. Sign up + onUserCreate
  console.log("\n>>> Setup...");
  const { idToken, uid } = await signUp();
  console.log(`  uid: ${uid}`);

  const cr = callCFviaCurl("onUserCreate", {}, idToken);
  console.log(`  onUserCreate: ${cr.body?.result?.status}`);

  await new Promise((r) => setTimeout(r, 500));
  await fsUpdate("users", uid, { creditsBalance: 20 });
  console.log(`  Credits: 20`);

  // 2. Upload test image
  const bucket = `${PROJECT_ID}.firebasestorage.app`;
  const storagePath = `uploads/${uid}/selfie.jpg`;
  const minJpeg = Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wgARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAVSf/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=", "base64");
  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`;
  const ur = await fetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${gcloudToken}`, "Content-Type": "image/jpeg" },
    body: minJpeg,
  });
  console.log(`  Image uploaded: ${ur.ok ? "OK" : "FAIL"}`);

  // 3. Fire genFlexTale (all 9 scenes)
  console.log(`\n${"─".repeat(60)}`);
  console.log(`>>> Calling genFlexTale — FULL 9 scenes`);
  console.log(`${"─".repeat(60)}`);

  const startTime = Date.now();
  console.log(`  Started at: ${new Date().toLocaleTimeString()}`);
  console.log(`  Estimated: ~3-5 min (9 scenes × ~20s + delays)...`);
  console.log();

  const { ok: cfOk, body: cfBody } = callCFviaCurl("genFlexTale", {
    inputImagePath: storagePath,
    storyId: "tale_paris_7days",
    // no selectedChapters → ALL 9 scenes
  }, idToken);
  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n  Total time: ${totalElapsed}s`);

  if (cfOk && cfBody?.result) {
    const r = cfBody.result;
    console.log(`  Status:        ${r.status}`);
    console.log(`  Story ID:      ${r.storyId}`);
    console.log(`  Total scenes:  ${r.totalScenes}`);
    console.log(`  Credits spent: ${r.creditsSpent}`);
    console.log(`  Credits left:  ${r.creditsRemaining}`);
    console.log(`  Avg/scene:     ${(parseFloat(totalElapsed) / r.totalScenes).toFixed(1)}s`);

    // 4. Check each scene
    console.log(`\n>>> Scene Details:`);
    console.log(`  ${"#".padEnd(3)} ${"Status".padEnd(10)} ${"Time".padEnd(8)} ${"Image".padEnd(5)} Scene Name`);
    console.log(`  ${"─".repeat(55)}`);

    let completedCount = 0;
    let failedCount = 0;

    for (let i = 1; i <= r.totalScenes; i++) {
      const scene = await fsGetDoc(`stories/${r.storyId}/scenes/scene_${i}`);
      if (scene) {
        const status = scene.status || "?";
        const name = scene.sceneName || "?";
        const timeMs = scene.generationTimeMs;
        const timeSec = timeMs ? `${(timeMs / 1000).toFixed(1)}s` : "—";
        const hasImg = scene.outputImageUrl ? "YES" : "NO";
        const icon = status === "completed" ? "✓" : status === "failed" ? "✗" : "?";
        console.log(`  ${icon} ${String(i).padEnd(2)} ${status.padEnd(10)} ${timeSec.padEnd(8)} ${hasImg.padEnd(5)} ${name}`);
        if (status === "completed") completedCount++;
        if (status === "failed") failedCount++;
      } else {
        console.log(`  ? ${String(i).padEnd(2)} MISSING`);
      }
    }

    console.log(`\n  Completed: ${completedCount}/${r.totalScenes}, Failed: ${failedCount}`);

    // 5. Check files in Storage
    console.log(`\n>>> Storage files:`);
    const listUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o?prefix=${encodeURIComponent(`stories/${uid}/${r.storyId}/`)}&maxResults=20`;
    const lr = await fetch(listUrl, { headers: { Authorization: `Bearer ${gcloudToken}` } });
    const listData = (await lr.json()) as any;
    if (listData.items) {
      let totalSize = 0;
      for (const item of listData.items) {
        const sizeKB = parseInt(item.size) / 1024;
        totalSize += sizeKB;
        console.log(`  ${(item.name as string).split("/").pop()!.padEnd(15)} ${sizeKB.toFixed(0).padStart(6)} KB`);
      }
      console.log(`  ${"─".repeat(25)}`);
      console.log(`  TOTAL: ${listData.items.length} files, ${(totalSize / 1024).toFixed(2)} MB`);
    } else {
      console.log(`  No files found!`);
    }

  } else {
    console.log(`\n  FAILED!`);
    console.log(`  Response:`, JSON.stringify(cfBody, null, 2).substring(0, 1000));
  }

  // 6. Final user state
  const uFinal = await fsGetDoc(`users/${uid}`);
  console.log(`\n>>> Final user state:`);
  console.log(`  creditsBalance:    ${uFinal?.creditsBalance}`);
  console.log(`  totalStories:      ${uFinal?.totalStories}`);

  // 7. Credit logs
  const logs = await fsQuery("creditLogs", "userId", uid);
  console.log(`\n>>> Credit logs (${logs.length}):`);
  for (const l of logs) {
    const d = l.data;
    const sign = typeof d.amount === "number" && d.amount > 0 ? "+" : "";
    console.log(`  ${d.type}: ${sign}${d.amount} → bal=${d.balanceAfter} | ${d.description}`);
  }

  // 8. Cleanup
  console.log("\n>>> Cleanup...");
  await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:delete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${gcloudToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ localId: uid }),
  });
  console.log("  Done\n");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
