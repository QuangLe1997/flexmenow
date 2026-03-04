/**
 * Upload mockup images to GCS and generate image manifest.
 *
 * Usage:
 *   npx ts-node tools/upload_images_to_gcs.ts            # upload + generate manifest
 *   npx ts-node tools/upload_images_to_gcs.ts --dry-run   # preview only
 *   npx ts-node tools/upload_images_to_gcs.ts --manifest-only  # regenerate manifest without uploading
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// ── Config ──────────────────────────────────────────────────────────────────
const BUCKET_NAME = 'flexme-now.firebasestorage.app';
const GCS_PREFIX = 'mockup-images';
const SOURCE_DIR = path.resolve(__dirname, '../../docs/mockup_app/public/assets/images');
const MANIFEST_PATH = path.resolve(__dirname, '../../public/config/image_manifest.json');

const BASE_URL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/`;
const SUFFIX = '?alt=media';

// ── Helpers ─────────────────────────────────────────────────────────────────

function walkDir(dir: string, base: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full, base));
    } else if (entry.isFile() && entry.name.endsWith('.png')) {
      results.push(path.relative(base, full).replace(/\\/g, '/'));
    }
  }
  return results;
}

function buildManifest(files: string[]): Record<string, any> {
  const images: Record<string, any> = {};

  for (const file of files) {
    const parts = file.split('/');
    const name = path.basename(file, '.png');
    const gcsPath = `${GCS_PREFIX}/${file}`;

    let target = images;
    // Build nested structure from directory path
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (!target[key]) target[key] = {};
      target = target[key];
    }
    target[name] = gcsPath;
  }

  return {
    version: '1.0.0',
    baseUrl: BASE_URL,
    suffix: SUFFIX,
    images,
  };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const manifestOnly = args.includes('--manifest-only');

  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Bucket: gs://${BUCKET_NAME}/${GCS_PREFIX}/`);
  console.log(`Mode:   ${dryRun ? 'DRY RUN' : manifestOnly ? 'MANIFEST ONLY' : 'UPLOAD + MANIFEST'}\n`);

  // Discover files
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const files = walkDir(SOURCE_DIR, SOURCE_DIR).sort();
  console.log(`Found ${files.length} PNG files:\n`);
  for (const f of files) {
    console.log(`  ${f}`);
  }
  console.log('');

  // Generate manifest
  const manifest = buildManifest(files);
  const manifestJson = JSON.stringify(manifest, null, 2);

  if (dryRun) {
    console.log('Generated manifest (preview):\n');
    console.log(manifestJson);
    console.log(`\nDry run complete. ${files.length} files would be uploaded.`);
    return;
  }

  // Write manifest
  const manifestDir = path.dirname(MANIFEST_PATH);
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }
  fs.writeFileSync(MANIFEST_PATH, manifestJson, 'utf-8');
  console.log(`Manifest written to: ${MANIFEST_PATH}`);

  if (manifestOnly) {
    console.log('Manifest-only mode. Skipping upload.');
    return;
  }

  // Initialize Firebase Admin
  admin.initializeApp({
    storageBucket: BUCKET_NAME,
  });
  const bucket = admin.storage().bucket();

  // Upload files
  let uploaded = 0;
  let skipped = 0;

  for (const file of files) {
    const localPath = path.join(SOURCE_DIR, file);
    const gcsPath = `${GCS_PREFIX}/${file}`;

    // Check if file already exists
    const gcsFile = bucket.file(gcsPath);
    const [exists] = await gcsFile.exists();

    if (exists) {
      console.log(`  SKIP (exists): ${gcsPath}`);
      skipped++;
      continue;
    }

    console.log(`  UPLOAD: ${gcsPath}`);
    await bucket.upload(localPath, {
      destination: gcsPath,
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Make public
    await gcsFile.makePublic();
    uploaded++;
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Skipped: ${skipped}, Total: ${files.length}`);

  // Print sample URLs
  console.log('\nSample URLs:');
  for (const file of files.slice(0, 3)) {
    const encoded = encodeURIComponent(`${GCS_PREFIX}/${file}`);
    console.log(`  ${BASE_URL}${encoded}${SUFFIX}`);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
