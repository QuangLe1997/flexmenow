/**
 * Generate sample images for FlexShot templates and FlexTale stories
 * using the local Z-Image server, then optimize and upload to GCS.
 *
 * Usage:
 *   npx ts-node tools/gen_sample_images.ts                          # gen ALL templates + stories
 *   npx ts-node tools/gen_sample_images.ts --templates              # gen templates only
 *   npx ts-node tools/gen_sample_images.ts --stories                # gen stories only
 *   npx ts-node tools/gen_sample_images.ts --id t001                # gen single template by ID
 *   npx ts-node tools/gen_sample_images.ts --id tale_paris_7days    # gen single story by ID
 *   npx ts-node tools/gen_sample_images.ts --dry-run                # preview prompts only
 *   npx ts-node tools/gen_sample_images.ts --skip-upload            # gen + optimize, skip GCS upload
 *   npx ts-node tools/gen_sample_images.ts --skip-existing          # skip images that already exist
 *   npx ts-node tools/gen_sample_images.ts --size 768x1024          # custom image size (WxH)
 *   npx ts-node tools/gen_sample_images.ts --quality 80             # JPEG/WebP quality (1-100)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

// ── Config ──────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:8188';
const API_KEY = 'test123';
const DEFAULT_WIDTH = 768;
const DEFAULT_HEIGHT = 1024;
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 200; // ~10 minutes max wait
const OPTIMIZE_QUALITY = 85;   // WebP quality

const TEMPLATES_JSON = path.resolve(__dirname, '../../public/config/flexshot_templates.json');
const STORIES_JSON = path.resolve(__dirname, '../../public/config/flextale_stories.json');
const OUTPUT_DIR = path.resolve(__dirname, '../../generated_images');
const OPTIMIZED_DIR = path.resolve(__dirname, '../../generated_images/optimized');

// GCS config
const BUCKET_NAME = 'flexme-now.firebasestorage.app';
const GCS_PREFIX = 'mockup-images';

// ── Types ───────────────────────────────────────────────────────────────────

interface GenTask {
  id: string;
  type: 'template' | 'story-cover' | 'story-chapter';
  name: string;
  prompt: string;
  negativePrompt: string;
  systemPrompt: string;
  gcsPath: string;        // target GCS path (relative)
  outputFile: string;     // local output filename
  width: number;
  height: number;
}

interface ApiTaskResult {
  task_id: string;
  status: 'queued' | 'loading' | 'generating' | 'done' | 'error';
  image_url?: string;
  image_file?: string;
  error?: string;
}

// ── HTTP helpers ────────────────────────────────────────────────────────────

function httpRequest(method: string, urlPath: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, API_BASE);
    const bodyStr = body ? JSON.stringify(body) : undefined;
    const headers: Record<string, string> = {
      'x-api-key': API_KEY,
    };
    if (bodyStr) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(bodyStr).toString();
    }
    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function downloadFile(urlPath: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, API_BASE);
    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      headers: { 'x-api-key': API_KEY },
    };

    http.get(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed: ${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

// ── Core functions ──────────────────────────────────────────────────────────

async function submitGeneration(task: GenTask): Promise<string> {
  const body = {
    model: 'zimage',
    prompt: task.prompt,
    negative_prompt: task.negativePrompt,
    system_prompt: task.systemPrompt,
    width: task.width,
    height: task.height,
    seed: -1,
    name: task.outputFile.replace('.png', ''),
  };

  const result = await httpRequest('POST', '/api/generate', body);
  if (!result.ok) {
    throw new Error(`Submit failed for ${task.id}: ${JSON.stringify(result)}`);
  }
  return result.task_id;
}

async function pollUntilDone(taskId: string): Promise<ApiTaskResult> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const result: ApiTaskResult = await httpRequest('GET', `/api/task/${taskId}`);

    if (result.status === 'done') return result;
    if (result.status === 'error') {
      throw new Error(`Generation error: ${result.error || 'unknown'}`);
    }

    // Log progress every 5 polls
    if (i > 0 && i % 5 === 0) {
      console.log(`    ... still ${result.status} (${i * POLL_INTERVAL_MS / 1000}s)`);
    }
  }
  throw new Error(`Timeout waiting for task ${taskId}`);
}

async function optimizeImage(inputPath: string, outputPath: string, quality: number): Promise<{ originalSize: number; optimizedSize: number }> {
  const sharp = require('sharp');
  const originalSize = fs.statSync(inputPath).size;

  await sharp(inputPath)
    .png({ quality: Math.min(quality, 100), compressionLevel: 9 })
    .toFile(outputPath);

  const optimizedSize = fs.statSync(outputPath).size;
  return { originalSize, optimizedSize };
}

async function uploadToGCS(localPath: string, gcsPath: string): Promise<string> {
  const admin = require('firebase-admin');

  // Initialize once
  if (!admin.apps.length) {
    admin.initializeApp({ storageBucket: BUCKET_NAME });
  }

  const bucket = admin.storage().bucket();
  const file = bucket.file(gcsPath);

  // Check if already exists
  const [exists] = await file.exists();
  if (exists) {
    console.log(`    SKIP (exists): ${gcsPath}`);
    return gcsPath;
  }

  await bucket.upload(localPath, {
    destination: gcsPath,
    metadata: {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000',
    },
  });

  await file.makePublic();
  console.log(`    UPLOADED: ${gcsPath}`);
  return gcsPath;
}

// ── Build task list from JSON ───────────────────────────────────────────────

function buildTemplateTasks(width: number, height: number, filterId?: string): GenTask[] {
  const json = JSON.parse(fs.readFileSync(TEMPLATES_JSON, 'utf-8'));
  const tasks: GenTask[] = [];

  for (const t of json.templates) {
    if (filterId && t.id !== filterId) continue;
    if (!t.isActive) continue;

    const nameEn = t.name.en || t.id;
    // Generate cover image
    tasks.push({
      id: t.id,
      type: 'template',
      name: `Template: ${nameEn}`,
      prompt: t.prompt.base.replace('{subject}', 'a beautiful young woman with natural features'),
      negativePrompt: t.prompt.negative || '',
      systemPrompt: t.prompt.styleHint || '',
      gcsPath: t.coverImage, // e.g. mockup-images/templates/gold/t1_paris_eiffel.png
      outputFile: `template_${t.id}_cover.png`,
      width,
      height,
    });

    // Generate viral variant preview
    if (t.previewImages && t.previewImages.length > 1) {
      const viralPath = t.previewImages[1]; // viral variant
      tasks.push({
        id: `${t.id}_viral`,
        type: 'template',
        name: `Template: ${nameEn} (viral)`,
        prompt: t.prompt.base.replace('{subject}', 'a handsome young man with confident expression'),
        negativePrompt: t.prompt.negative || '',
        systemPrompt: t.prompt.styleHint || '',
        gcsPath: viralPath,
        outputFile: `template_${t.id}_viral.png`,
        width,
        height,
      });
    }
  }

  return tasks;
}

// Copy mapping: after gen, copy chapter images → cover/preview (avoid duplicate gen)
interface CopyTask {
  src: string;   // source outputFile (chapter image)
  dst: string;   // destination outputFile (cover or preview)
  gcsPath: string;
}

let storyCopyTasks: CopyTask[] = [];

function buildStoryTasks(width: number, height: number, filterId?: string): GenTask[] {
  const json = JSON.parse(fs.readFileSync(STORIES_JSON, 'utf-8'));
  const tasks: GenTask[] = [];
  storyCopyTasks = [];

  for (const s of json.stories) {
    if (filterId && s.id !== filterId) continue;
    if (!s.isActive) continue;

    // Map gender → subject text for prompt
    const subjectMap: Record<string, string> = {
      female: 'a beautiful young woman with natural features',
      male: 'a handsome young man with confident expression',
      couple: 'a beautiful young couple, man and woman together',
      all: 'a stylish young person with natural features',
    };
    const subject = subjectMap[s.gender] || subjectMap.all;

    // Only generate chapter images (each chapter = 1 unique prompt)
    for (const ch of s.chapters) {
      if (!ch.prompt?.base) continue;
      tasks.push({
        id: `${s.id}_ch${ch.order}`,
        type: 'story-chapter',
        name: `Story ch${ch.order}: ${ch.heading.en}`,
        prompt: ch.prompt.base.replace('{subject}', subject),
        negativePrompt: ch.prompt.negative || '',
        systemPrompt: ch.prompt.styleHint || '',
        gcsPath: `mockup-images/stories/${s.id}/ch${ch.order}.png`,
        outputFile: `story_${s.id}_ch${ch.order}.png`,
        width,
        height,
      });
    }

    // Cover = copy of chapter 1
    storyCopyTasks.push({
      src: `story_${s.id}_ch1.png`,
      dst: `story_${s.id}_cover.png`,
      gcsPath: s.coverImage,
    });

    // Previews = copy of chapters 1, 2, 3
    if (s.previewImages) {
      for (let pi = 0; pi < s.previewImages.length; pi++) {
        const chOrder = Math.min(pi + 1, s.chapters.length);
        storyCopyTasks.push({
          src: `story_${s.id}_ch${chOrder}.png`,
          dst: `story_${s.id}_preview_${pi}.png`,
          gcsPath: s.previewImages[pi],
        });
      }
    }
  }

  return tasks;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipUpload = args.includes('--skip-upload');
  const skipExisting = args.includes('--skip-existing');
  const templatesOnly = args.includes('--templates');
  const storiesOnly = args.includes('--stories');

  // Parse --id filter
  const idIdx = args.indexOf('--id');
  const filterId = idIdx >= 0 ? args[idIdx + 1] : undefined;

  // Parse --size WxH
  const sizeIdx = args.indexOf('--size');
  let width = DEFAULT_WIDTH;
  let height = DEFAULT_HEIGHT;
  if (sizeIdx >= 0 && args[sizeIdx + 1]) {
    const [w, h] = args[sizeIdx + 1].split('x').map(Number);
    if (w && h) { width = w; height = h; }
  }

  // Parse --quality
  const qualityIdx = args.indexOf('--quality');
  const quality = qualityIdx >= 0 ? parseInt(args[qualityIdx + 1]) || OPTIMIZE_QUALITY : OPTIMIZE_QUALITY;

  // Ensure output dirs exist
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });

  // Build task list
  let tasks: GenTask[] = [];
  if (!storiesOnly) tasks.push(...buildTemplateTasks(width, height, filterId));
  if (!templatesOnly) tasks.push(...buildStoryTasks(width, height, filterId));

  if (tasks.length === 0) {
    console.log('No tasks to process. Check --id filter or JSON files.');
    return;
  }

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        FlexMe Sample Image Generator                   ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Server:  ${API_BASE.padEnd(45)}║`);
  console.log(`║  Model:   ${'Z-Image-Turbo'.padEnd(45)}║`);
  console.log(`║  Size:    ${`${width}x${height}`.padEnd(45)}║`);
  console.log(`║  Quality: ${`${quality} (PNG optimize)`.padEnd(45)}║`);
  console.log(`║  Tasks:   ${`${tasks.length} images to generate`.padEnd(45)}║`);
  console.log(`║  Mode:    ${(dryRun ? 'DRY RUN' : skipUpload ? 'GEN + OPTIMIZE (no upload)' : 'GEN + OPTIMIZE + UPLOAD GCS').padEnd(45)}║`);
  if (skipExisting) {
  console.log(`║  Skip:    ${'existing images will be skipped'.padEnd(45)}║`);
  }
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  if (dryRun) {
    console.log('Tasks preview:\n');
    for (const t of tasks) {
      console.log(`  [${t.type}] ${t.name}`);
      console.log(`    Prompt: ${t.prompt.slice(0, 120)}...`);
      console.log(`    GCS:    ${t.gcsPath}`);
      console.log(`    Output: ${t.outputFile}\n`);
    }
    console.log(`\nDry run complete. ${tasks.length} images would be generated.`);
    return;
  }

  // Check server health
  const health = await httpRequest('GET', '/api/health');
  if (health.status !== 'ok') {
    console.error('Server not healthy:', health);
    process.exit(1);
  }
  console.log(`Server OK. Worker: ${health.worker_alive ? 'alive' : 'dead'}, Model: ${health.loaded_model || 'none'}\n`);

  // Process tasks sequentially (queue-based server)
  let completed = 0;
  let failed = 0;
  let skipped = 0;
  let totalOriginalBytes = 0;
  let totalOptimizedBytes = 0;

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const progress = `[${i + 1}/${tasks.length}]`;

    // Skip existing images if --skip-existing flag is set
    if (skipExisting) {
      const optPath = path.join(OPTIMIZED_DIR, task.outputFile);
      const rawPath = path.join(OUTPUT_DIR, task.outputFile);
      if (fs.existsSync(optPath) || fs.existsSync(rawPath)) {
        skipped++;
        console.log(`${progress} SKIP (exists): ${task.outputFile}`);
        continue;
      }
    }

    console.log(`${progress} ${task.name}`);
    console.log(`    Prompt: ${task.prompt.slice(0, 100)}...`);

    try {
      // 1) Submit to server
      const taskId = await submitGeneration(task);
      console.log(`    Submitted: ${taskId}`);

      // 2) Poll until done
      const result = await pollUntilDone(taskId);
      console.log(`    Generated: ${result.image_file}`);

      // 3) Download image
      const rawPath = path.join(OUTPUT_DIR, task.outputFile);
      await downloadFile(result.image_url!, rawPath);
      console.log(`    Downloaded: ${rawPath}`);

      // 4) Optimize image
      const optPath = path.join(OPTIMIZED_DIR, task.outputFile);
      const { originalSize, optimizedSize } = await optimizeImage(rawPath, optPath, quality);
      const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
      totalOriginalBytes += originalSize;
      totalOptimizedBytes += optimizedSize;
      console.log(`    Optimized: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${savings}% saved)`);

      // 5) Upload to GCS
      if (!skipUpload) {
        await uploadToGCS(optPath, task.gcsPath);
      }

      completed++;
      console.log(`    Done!\n`);

    } catch (err: any) {
      console.error(`    ERROR: ${err.message}\n`);
      failed++;
    }
  }

  // Copy chapter images → cover/preview (dedup step)
  if (storyCopyTasks.length > 0) {
    console.log(`\nCopying ${storyCopyTasks.length} cover/preview images from chapters...\n`);
    let copied = 0;
    for (const ct of storyCopyTasks) {
      const srcPath = path.join(OPTIMIZED_DIR, ct.src);
      const dstPath = path.join(OPTIMIZED_DIR, ct.dst);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, dstPath);
        // Also copy raw
        const srcRaw = path.join(OUTPUT_DIR, ct.src);
        const dstRaw = path.join(OUTPUT_DIR, ct.dst);
        if (fs.existsSync(srcRaw)) fs.copyFileSync(srcRaw, dstRaw);
        // Upload copy to GCS if needed
        if (!skipUpload) {
          await uploadToGCS(dstPath, ct.gcsPath);
        }
        copied++;
      } else {
        console.log(`    SKIP copy: ${ct.src} not found`);
      }
    }
    console.log(`  Copied ${copied}/${storyCopyTasks.length} files.\n`);
  }

  // Summary
  const totalSavings = totalOriginalBytes > 0
    ? ((1 - totalOptimizedBytes / totalOriginalBytes) * 100).toFixed(1)
    : '0';

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  COMPLETE: ${completed} generated, ${skipped} skipped, ${failed} failed`);
  console.log(`  Size:     ${formatBytes(totalOriginalBytes)} → ${formatBytes(totalOptimizedBytes)} (${totalSavings}% saved)`);
  console.log(`  Output:   ${OUTPUT_DIR}`);
  if (!skipUpload) {
    console.log(`  GCS:      gs://${BUCKET_NAME}/${GCS_PREFIX}/`);
  }
  console.log('═══════════════════════════════════════════════════════════');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
