/**
 * Test Image Generation CFs — check for errors, output URLs, file sizes
 *
 * Usage: cd scripts && npx ts-node test/test_gen_images.ts
 */

import "dotenv/config";
import { execSync } from "child_process";

const PROJECT_ID = "flexme-now";
const REGION = "asia-southeast1";
const CF_BASE = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

const gcloudToken = execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim();

async function signUp() {
  const apiKey = process.env.FIREBASE_API_KEY || "";
  if (!apiKey) throw new Error("FIREBASE_API_KEY env var not set");
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnSecureToken: true }),
    }
  );
  const d = (await r.json()) as any;
  return { idToken: d.idToken as string, uid: d.localId as string };
}

async function callCF(name: string, data: any, idToken: string) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`>>> ${name}`);
  console.log(`${"─".repeat(50)}`);
  const start = Date.now();
  const r = await fetch(`${CF_BASE}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ data }),
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const text = await r.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  console.log(`Status: ${r.status} (${elapsed}s)`);

  if (r.ok && body?.result) {
    console.log(`Result:`, JSON.stringify(body.result, null, 2));
  } else {
    console.log(`ERROR Response:`);
    console.log(JSON.stringify(body, null, 2).substring(0, 800));
  }

  return { ok: r.ok, status: r.status, body, elapsed };
}

async function main() {
  console.log(`\n${"═".repeat(50)}`);
  console.log(`  FlexMe — Image Generation Test`);
  console.log(`${"═".repeat(50)}`);

  // 1. Sign up
  console.log("\n>>> Signing up anonymous user...");
  const { idToken, uid } = await signUp();
  console.log(`uid: ${uid}`);

  // 2. onUserCreate
  const cr = await callCF("onUserCreate", {}, idToken);
  if (!cr.ok) {
    console.log("FATAL: onUserCreate failed");
    return;
  }

  // 3. Upload test image
  console.log("\n>>> Uploading test image...");
  const bucket = `${PROJECT_ID}.firebasestorage.app`;
  const storagePath = `uploads/${uid}/test_face.jpg`;
  const minJpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wgARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAVSf/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=",
    "base64"
  );

  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`;
  const ur = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gcloudToken}`,
      "Content-Type": "image/jpeg",
    },
    body: minJpeg,
  });
  console.log(`Upload: ${ur.ok ? "OK" : "FAIL " + (await ur.text()).substring(0, 200)}`);

  // 4. Test genFlexLocket
  const locketResult = await callCF(
    "genFlexLocket",
    {
      inputImagePath: storagePath,
      enhanceMode: "real",
      filterId: "natural",
    },
    idToken
  );

  // 5. Test genFlexShot
  const shotResult = await callCF(
    "genFlexShot",
    {
      inputImagePath: storagePath,
      templateId: "t001",
    },
    idToken
  );

  // 6. Test genFlexTale (1 scene only to save credits)
  const taleResult = await callCF(
    "genFlexTale",
    {
      inputImagePath: storagePath,
      storyId: "tale_paris_7days",
      selectedChapters: [1],
    },
    idToken
  );

  // 7. Check generated files in Storage
  console.log(`\n${"─".repeat(50)}`);
  console.log(">>> Generated files in Storage");
  console.log(`${"─".repeat(50)}`);

  for (const prefix of [`generations/${uid}/`, `stories/${uid}/`]) {
    const listUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o?prefix=${encodeURIComponent(prefix)}&maxResults=20`;
    const lr = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${gcloudToken}` },
    });
    const listData = (await lr.json()) as any;
    if (listData.items && listData.items.length > 0) {
      for (const item of listData.items) {
        const sizeKB = (parseInt(item.size) / 1024).toFixed(1);
        console.log(`  ${item.name} (${sizeKB} KB, ${item.contentType})`);
      }
    }
  }

  // 8. Check CF logs for errors
  console.log(`\n${"─".repeat(50)}`);
  console.log(">>> Recent CF logs (errors/warnings)");
  console.log(`${"─".repeat(50)}`);
  try {
    const logs = execSync(
      `gcloud functions logs read --gen2 --region=${REGION} --project=${PROJECT_ID} --limit=30 2>&1 | grep -iE "(error|fail|warn|insufficient|exception)" | tail -15`,
      { encoding: "utf8", timeout: 15000 }
    );
    if (logs.trim()) console.log(logs);
    else console.log("  No errors/warnings in recent logs");
  } catch {
    console.log("  (Could not fetch CF logs)");
  }

  // Summary
  console.log(`\n${"═".repeat(50)}`);
  console.log("  SUMMARY");
  console.log(`${"═".repeat(50)}`);
  console.log(
    `  genFlexLocket: ${locketResult.ok ? "OK" : "FAIL"} (${locketResult.elapsed}s)`
  );
  console.log(
    `  genFlexShot:   ${shotResult.ok ? "OK" : "FAIL"} (${shotResult.elapsed}s)`
  );
  console.log(
    `  genFlexTale:   ${taleResult.ok ? "OK" : "FAIL"} (${taleResult.elapsed}s)`
  );

  if (locketResult.ok && locketResult.body?.result?.outputImageUrl) {
    console.log(`\n  Locket output: ${locketResult.body.result.outputImageUrl}`);
  }

  // 9. Cleanup
  console.log("\n>>> Cleanup...");
  await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:delete`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gcloudToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ localId: uid }),
    }
  );
  console.log("Done\n");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
