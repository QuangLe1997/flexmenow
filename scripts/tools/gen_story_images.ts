/**
 * Generate ALL story images for FlexTale using local Z-Image server.
 * Loads stories from Firestore DB, saves to local JSON cache, then generates.
 *
 * Usage:
 *   cd scripts && npx ts-node tools/gen_story_images.ts                    # gen ALL stories
 *   cd scripts && npx ts-node tools/gen_story_images.ts --from s050        # start from story s050
 *   cd scripts && npx ts-node tools/gen_story_images.ts --id s001          # gen single story
 *   cd scripts && npx ts-node tools/gen_story_images.ts --dry-run          # preview only
 *   cd scripts && npx ts-node tools/gen_story_images.ts --skip-existing    # skip stories with all webp files
 *   cd scripts && npx ts-node tools/gen_story_images.ts --use-cache        # skip DB fetch, use cached JSON
 *   cd scripts && npx ts-node tools/gen_story_images.ts --upload           # gen + upload to GCS (overwrite existing)
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

// ── Config ──────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:8188';
const API_KEY = 'test123';
const WIDTH = 768;
const HEIGHT = 1024;
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 300; // ~10 minutes per image
const WEBP_QUALITY = 88;

const PROJECT_ID = 'flexme-now';
const BUCKET_NAME = 'flexme-now.firebasestorage.app';
const GCS_STORIES_PREFIX = 'mockup-images/stories';
const CACHE_JSON = path.resolve(__dirname, '../../generated_images/stories_cache.json');
const OUTPUT_DIR = path.resolve(__dirname, '../../generated_images/stories');

// ── Types ───────────────────────────────────────────────────────────────────

interface Chapter {
  order: number;
  heading: { en: string };
  prompt?: {
    base: string;
    negative?: string;
    styleHint?: string;
  };
  aiConfig?: any;
}

interface Story {
  id: string;
  slug: string;
  title: { en: string };
  gender: string;
  isActive: boolean;
  totalPics: number;
  chapters: Chapter[];
  coverImage?: string;
  previewImages?: string[];
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
    const headers: Record<string, string> = { 'x-api-key': API_KEY };
    if (bodyStr) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(bodyStr).toString();
    }
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`Invalid JSON: ${data.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function downloadFile(urlPath: string, dest: string, maxRedirects = 5): Promise<void> {
  return new Promise((resolve, reject) => {
    const doGet = (targetUrl: string, redirectsLeft: number) => {
      const url = new URL(targetUrl, API_BASE);
      const proto = url.protocol === 'https:' ? require('https') : http;
      proto.get({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        headers: { 'x-api-key': API_KEY },
      }, (res: any) => {
        // Follow redirects (301, 302, 307, 308)
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          if (redirectsLeft <= 0) {
            reject(new Error(`Too many redirects for ${urlPath}`));
            return;
          }
          doGet(res.headers.location, redirectsLeft - 1);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: ${res.statusCode} for ${targetUrl}`));
          return;
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', reject);
    };
    doGet(urlPath, maxRedirects);
  });
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Firestore: load stories from DB ─────────────────────────────────────────

async function loadStoriesFromFirestore(): Promise<Story[]> {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const db = admin.firestore();

  console.log('Loading stories from Firestore...');
  const packsSnap = await db.collection('storyPacks').get();

  const stories: Story[] = [];

  for (const doc of packsSnap.docs) {
    const d = doc.data();

    // Load scenes subcollection
    const scenesSnap = await db.collection('storyPacks').doc(doc.id).collection('scenes')
      .orderBy('sceneOrder')
      .get();

    const chapters: Chapter[] = scenesSnap.docs.map(sc => {
      const s = sc.data();
      return {
        order: s.sceneOrder,
        heading: { en: s.sceneName || s.sceneNameI18n?.en || '' },
        prompt: s.promptTemplate ? {
          base: s.promptTemplate,
          negative: s.negativePrompt || '',
          styleHint: s.styleHint || '',
        } : undefined,
        aiConfig: s.imagenParams || undefined,
      };
    });

    stories.push({
      id: doc.id,
      slug: doc.id,
      title: { en: d.name || d.nameI18n?.en || doc.id },
      gender: d.gender || 'all',
      isActive: d.isActive !== false,
      totalPics: chapters.length,
      chapters,
      coverImage: d.coverImage || undefined,
      previewImages: d.previewUrls || undefined,
    });
  }

  // Sort by ID (s001, s002, ...)
  stories.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  console.log(`Loaded ${stories.length} stories from Firestore (${stories.reduce((s, st) => s + st.chapters.length, 0)} total scenes)`);
  return stories;
}

function saveCache(stories: Story[]): void {
  fs.mkdirSync(path.dirname(CACHE_JSON), { recursive: true });
  fs.writeFileSync(CACHE_JSON, JSON.stringify({ stories, cachedAt: new Date().toISOString() }, null, 2));
  console.log(`Cached to ${CACHE_JSON}`);
}

function loadCache(): Story[] {
  if (!fs.existsSync(CACHE_JSON)) {
    throw new Error(`Cache not found: ${CACHE_JSON}. Run without --use-cache first.`);
  }
  const data = JSON.parse(fs.readFileSync(CACHE_JSON, 'utf-8'));
  console.log(`Loaded ${data.stories.length} stories from cache (${data.cachedAt})`);
  return data.stories;
}

// ── GCS: upload to Firebase Storage (overwrite existing) ────────────────────

async function uploadToGCS(localPath: string, gcsPath: string): Promise<void> {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID, storageBucket: BUCKET_NAME });
  }
  const bucket = admin.storage().bucket();
  await bucket.upload(localPath, {
    destination: gcsPath,
    metadata: {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=3600',
    },
  });
  await bucket.file(gcsPath).makePublic();
}

// ── Core: submit one chapter ────────────────────────────────────────────────

async function submitChapter(story: Story, chapter: Chapter, subject: string): Promise<string> {
  const body = {
    model: 'zimage',
    prompt: chapter.prompt!.base.replace('{subject}', subject),
    negative_prompt: chapter.prompt!.negative || '',
    system_prompt: chapter.prompt!.styleHint || '',
    width: WIDTH,
    height: HEIGHT,
    seed: -1,
    name: `story_${story.id}_ch${chapter.order}`,
    metadata: {
      storyId: story.id,
      storySlug: story.slug,
      storyTitle: story.title.en,
      gender: story.gender,
      chapter: chapter.order,
      chapterHeading: chapter.heading.en,
      totalChapters: story.totalPics,
      outputPath: `generated_images/stories/${story.id}/ch${chapter.order}.webp`,
    },
  };
  const result = await httpRequest('POST', '/api/generate', body);
  if (!result.ok) {
    throw new Error(`Submit failed: ${JSON.stringify(result)}`);
  }
  return result.task_id;
}

// ── Core: poll single task ──────────────────────────────────────────────────

async function pollTask(taskId: string): Promise<ApiTaskResult> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await sleep(POLL_INTERVAL_MS);
    const result: ApiTaskResult = await httpRequest('GET', `/api/task/${taskId}`);
    if (result.status === 'done') return result;
    if (result.status === 'error') {
      throw new Error(`Generation error: ${result.error || 'unknown'}`);
    }
  }
  throw new Error(`Timeout waiting for task ${taskId}`);
}

// ── Core: process one story (submit all → poll all → download all → webp) ──

async function processStory(
  story: Story,
  storyIdx: number,
  totalStories: number,
  upload: boolean,
): Promise<{ generated: number; failed: number; uploaded: number }> {
  const subjectMap: Record<string, string> = {
    female: 'a beautiful young woman with natural features',
    male: 'a handsome young man with confident expression',
    couple: 'a beautiful young couple, man and woman together',
    all: 'a stylish young person with natural features',
  };
  const subject = subjectMap[story.gender] || subjectMap.all;

  const chapters = story.chapters.filter(ch => ch.prompt?.base);
  if (chapters.length === 0) return { generated: 0, failed: 0, uploaded: 0 };

  const storyDir = path.join(OUTPUT_DIR, story.id);
  fs.mkdirSync(storyDir, { recursive: true });

  const progress = `[${storyIdx + 1}/${totalStories}]`;
  console.log(`\n${progress} ${story.id}: "${story.title.en}" (${chapters.length} chapters, ${story.gender})`);

  // Step 1: Submit ALL chapters
  const taskMap: { chapter: Chapter; taskId: string }[] = [];
  for (const ch of chapters) {
    try {
      const taskId = await submitChapter(story, ch, subject);
      taskMap.push({ chapter: ch, taskId });
      console.log(`  ch${ch.order} submitted: ${taskId}`);
    } catch (err: any) {
      console.error(`  ch${ch.order} SUBMIT ERROR: ${err.message}`);
    }
  }

  if (taskMap.length === 0) return { generated: 0, failed: chapters.length, uploaded: 0 };

  // Step 2: Poll ALL tasks concurrently
  console.log(`  Waiting for ${taskMap.length} images...`);
  const results = await Promise.allSettled(
    taskMap.map(async ({ chapter, taskId }) => {
      const result = await pollTask(taskId);
      return { chapter, result };
    })
  );

  // Step 3: Download, convert to WebP, upload to GCS
  const sharp = require('sharp');
  let generated = 0;
  let failed = 0;
  let uploaded = 0;

  for (const r of results) {
    if (r.status === 'rejected') {
      console.error(`  POLL ERROR: ${r.reason}`);
      failed++;
      continue;
    }
    const { chapter, result } = r.value;
    const pngPath = path.join(storyDir, `ch${chapter.order}.png`);
    const webpPath = path.join(storyDir, `ch${chapter.order}.webp`);
    const gcsPath = `${GCS_STORIES_PREFIX}/${story.id}/ch${chapter.order}.webp`;

    try {
      // Download PNG (keep original)
      await downloadFile(result.image_url!, pngPath);

      // Convert to WebP
      await sharp(pngPath)
        .webp({ quality: WEBP_QUALITY })
        .toFile(webpPath);

      const pngSize = fs.statSync(pngPath).size;
      const webpSize = fs.statSync(webpPath).size;

      // Upload to GCS (overwrite existing)
      if (upload) {
        await uploadToGCS(webpPath, gcsPath);
        console.log(`  ch${chapter.order} done (png:${formatBytes(pngSize)} webp:${formatBytes(webpSize)}) → uploaded ${gcsPath}`);
        uploaded++;
      } else {
        console.log(`  ch${chapter.order} done (png:${formatBytes(pngSize)} webp:${formatBytes(webpSize)})`);
      }
      generated++;
    } catch (err: any) {
      console.error(`  ch${chapter.order} DOWNLOAD/CONVERT ERROR: ${err.message}`);
      failed++;
    }
  }

  const icon = failed === 0 ? '\u2713' : `${generated}/${chapters.length}`;
  console.log(`${progress} ${story.id}: ${icon}`);

  return { generated, failed, uploaded };
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipExisting = args.includes('--skip-existing');
  const useCache = args.includes('--use-cache');
  const upload = args.includes('--upload');

  // Parse --id
  const idIdx = args.indexOf('--id');
  const filterId = idIdx >= 0 ? args[idIdx + 1] : undefined;

  // Parse --from
  const fromIdx = args.indexOf('--from');
  const fromId = fromIdx >= 0 ? args[fromIdx + 1] : undefined;

  // Load stories from Firestore or cache
  let stories: Story[];
  if (useCache) {
    stories = loadCache();
  } else {
    stories = await loadStoriesFromFirestore();
    saveCache(stories);
  }
  stories = stories.filter((s: Story) => s.isActive);

  // Filter by --id
  if (filterId) {
    stories = stories.filter(s => s.id === filterId);
    if (stories.length === 0) {
      console.error(`Story "${filterId}" not found or inactive.`);
      process.exit(1);
    }
  }

  // Filter by --from
  if (fromId) {
    const idx = stories.findIndex(s => s.id === fromId);
    if (idx < 0) {
      console.error(`Story "${fromId}" not found. Available: ${stories.slice(0, 5).map(s => s.id).join(', ')}...`);
      process.exit(1);
    }
    stories = stories.slice(idx);
  }

  const totalChapters = stories.reduce((sum, s) => sum + s.chapters.filter(ch => ch.prompt?.base).length, 0);

  // Header
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        FlexTale Story Image Generator                   ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Server:  ${API_BASE.padEnd(45)}║`);
  console.log(`║  Size:    ${`${WIDTH}x${HEIGHT}`.padEnd(45)}║`);
  console.log(`║  Quality: ${`WebP ${WEBP_QUALITY}`.padEnd(45)}║`);
  console.log(`║  Stories: ${`${stories.length} stories, ${totalChapters} chapters`.padEnd(45)}║`);
  console.log(`║  Output:  ${`generated_images/stories/`.padEnd(45)}║`);
  const modeStr = dryRun ? 'DRY RUN' : `GEN${upload ? ' + UPLOAD GCS' : ''}${skipExisting ? ' (skip existing)' : ''}`;
  console.log(`║  Mode:    ${modeStr.padEnd(45)}║`);
  if (fromId) console.log(`║  From:    ${fromId.padEnd(45)}║`);
  if (filterId) console.log(`║  Single:  ${filterId.padEnd(45)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  // Dry run
  if (dryRun) {
    console.log('\nStories preview:\n');
    for (const s of stories) {
      const chs = s.chapters.filter(ch => ch.prompt?.base);
      console.log(`  ${s.id}: "${s.title.en}" — ${chs.length} chapters (${s.gender})`);
      for (const ch of chs) {
        console.log(`    ch${ch.order}: ${ch.prompt!.base.slice(0, 80)}...`);
      }
    }
    console.log(`\nDry run complete. ${totalChapters} images would be generated.`);
    return;
  }

  // Ensure output dir
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Check server health
  try {
    const health = await httpRequest('GET', '/api/health');
    if (health.status !== 'ok') {
      console.error('\nServer not healthy:', health);
      process.exit(1);
    }
    console.log(`\nServer OK. Worker: ${health.worker_alive ? 'alive' : 'dead'}, Model: ${health.loaded_model || 'none'}\n`);
  } catch (err: any) {
    console.error(`\nCannot connect to ${API_BASE}: ${err.message}`);
    process.exit(1);
  }

  // Process stories
  let totalGenerated = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalUploaded = 0;
  const startTime = Date.now();

  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];

    // Skip existing check
    if (skipExisting) {
      const storyDir = path.join(OUTPUT_DIR, story.id);
      const chapters = story.chapters.filter(ch => ch.prompt?.base);
      const allExist = chapters.length > 0 && chapters.every(ch =>
        fs.existsSync(path.join(storyDir, `ch${ch.order}.webp`))
      );
      if (allExist) {
        totalSkipped++;
        console.log(`[${i + 1}/${stories.length}] SKIP (exists): ${story.id}`);
        continue;
      }
    }

    try {
      const { generated, failed, uploaded } = await processStory(story, i, stories.length, upload);
      totalGenerated += generated;
      totalFailed += failed;
      totalUploaded += uploaded;
    } catch (err: any) {
      console.error(`\n[${i + 1}/${stories.length}] ${story.id} FATAL: ${err.message}`);
      totalFailed += story.chapters.filter(ch => ch.prompt?.base).length;
    }
  }

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  const elapsedMin = (parseInt(elapsed) / 60).toFixed(1);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  COMPLETE in ${elapsedMin} minutes`);
  console.log(`  Generated: ${totalGenerated} images`);
  if (upload) console.log(`  Uploaded:  ${totalUploaded} to GCS`);
  console.log(`  Skipped:   ${totalSkipped} stories`);
  console.log(`  Failed:    ${totalFailed} images`);
  console.log(`  Output:    ${OUTPUT_DIR}`);
  if (upload) console.log(`  GCS:       gs://${BUCKET_NAME}/${GCS_STORIES_PREFIX}/`);
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
