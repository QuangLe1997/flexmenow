/**
 * deploy_stories.ts
 *
 * Build flextale_stories.json from all batch defs, convert PNG→WebP, upload to GCS.
 * Output JSON matches StoriesResponse format expected by the Flutter app.
 *
 * Usage:
 *   npx ts-node tools/deploy_stories.ts                    # build + upload all
 *   npx ts-node tools/deploy_stories.ts --dry-run          # preview only
 *   npx ts-node tools/deploy_stories.ts --json-only        # upload JSON only
 *   npx ts-node tools/deploy_stories.ts --images-only      # upload images only
 *   npx ts-node tools/deploy_stories.ts --skip-existing    # skip already uploaded images
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

// ── Config ──────────────────────────────────────────────────────────────────
const BUCKET = 'gs://flexme-now.firebasestorage.app';
const BUCKET_NAME = 'flexme-now.firebasestorage.app';
const IMAGE_BASE_URL = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/`;
const IMAGE_SUFFIX = '?alt=media';
const STORIES_GCS_PATH = 'config/flextale_stories.json';
const IMAGES_GCS_PREFIX = 'mockup-images/stories';
const BATCH_DEFS_DIR = path.resolve(__dirname, '../data/story_defs');
const OUTPUT_JSON = path.resolve(__dirname, '../../public/config/flextale_stories.json');
const IMAGES_DIR = path.resolve(__dirname, '../../generated_images');
const WEBP_DIR = path.resolve(__dirname, '../../generated_images/webp');
const WEBP_QUALITY = 82;
const VERSION = '1.0.0';

// ── Types ───────────────────────────────────────────────────────────────────
interface BatchStoryDef {
  slug: string;
  title: [string, string];
  desc: [string, string];
  cat: string;
  type: string;
  gender: string;
  dur: string;
  badge: string | null;
  premium: boolean;
  neg: string;
  style: string;
  gs: number;
  tags: string[];
  chs: [string, string, string, string, string][];
}

// Matches ChapterData in Flutter app
interface BuiltChapter {
  order: number;
  heading: { en: string; vi: string };
  text: { en: string; vi: string };       // app uses "text" not "caption"
  choices: Record<string, string[]>;       // app expects choices (empty for preset stories)
  prompt: { base: string; negative: string; styleHint: string };
  aiConfig: {
    model: string;
    guidanceScale: number;
    aspectRatio: string;
    referenceType: string;
  };
}

// Matches StoryData in Flutter app
interface BuiltStory {
  id: string;
  slug: string;
  title: { en: string; vi: string };
  description: { en: string; vi: string };
  category: string;
  type: string;
  gender: string;
  duration: string;
  totalPics: number;
  credits: number;
  badge: string | null;
  premium: boolean;
  isActive: boolean;
  sortOrder: number;
  coverImage: string;
  previewImages: string[];
  chapters: BuiltChapter[];
  tags: string[];
  stats: { likes: number; views: number; generates: number };
  createdAt: string;
  updatedAt: string;
}

// Matches StoriesResponse in Flutter app
interface StoriesResponse {
  version: string;
  updatedAt: string;
  imageBaseUrl: string;
  imageSuffix: string;
  categories: { id: string; name: Record<string, string> }[];
  types: { id: string; name: Record<string, string> }[];
  genders: { id: string; name: Record<string, string> }[];
  durations: { id: string; name: Record<string, string> }[];
  stories: BuiltStory[];
}

// ── GCS helper ──────────────────────────────────────────────────────────────
function gcsUpload(localPath: string, gcsPath: string, contentType: string): void {
  execSync(
    `gcloud storage cp "${localPath}" "${BUCKET}/${gcsPath}" --content-type="${contentType}" --cache-control="public, max-age=31536000"`,
    { stdio: 'pipe' },
  );
}

function gcsExists(gcsPath: string): boolean {
  try {
    execSync(`gcloud storage ls "${BUCKET}/${gcsPath}"`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ── Filter metadata ─────────────────────────────────────────────────────────
const CATEGORY_NAMES: Record<string, Record<string, string>> = {
  couple: { en: 'Couple', vi: 'Cặp Đôi', es: 'Pareja', pt: 'Casal', ja: 'カップル', ko: '커플' },
  lifestyle: { en: 'Lifestyle', vi: 'Phong Cách', es: 'Estilo', pt: 'Estilo', ja: 'ライフスタイル', ko: '라이프스타일' },
  emotion: { en: 'Emotion', vi: 'Cảm Xúc', es: 'Emoción', pt: 'Emoção', ja: '感情', ko: '감정' },
  career: { en: 'Career', vi: 'Sự Nghiệp', es: 'Carrera', pt: 'Carreira', ja: 'キャリア', ko: '커리어' },
  hobby: { en: 'Hobby', vi: 'Sở Thích', es: 'Hobby', pt: 'Hobby', ja: '趣味', ko: '취미' },
  social: { en: 'Social', vi: 'Xã Hội', es: 'Social', pt: 'Social', ja: 'ソーシャル', ko: '소셜' },
  seasonal: { en: 'Seasonal', vi: 'Mùa', es: 'Temporada', pt: 'Temporada', ja: '季節', ko: '시즌' },
  travel: { en: 'Travel', vi: 'Du Lịch', es: 'Viaje', pt: 'Viagem', ja: '旅行', ko: '여행' },
  wealth: { en: 'Wealth', vi: 'Giàu Sang', es: 'Riqueza', pt: 'Riqueza', ja: '富', ko: '부' },
  beauty: { en: 'Beauty', vi: 'Làm Đẹp', es: 'Belleza', pt: 'Beleza', ja: '美容', ko: '뷰티' },
  pet: { en: 'Pet', vi: 'Thú Cưng', es: 'Mascota', pt: 'Pet', ja: 'ペット', ko: '반려동물' },
  trending: { en: 'Trending', vi: 'Xu Hướng', es: 'Tendencia', pt: 'Tendência', ja: 'トレンド', ko: '트렌드' },
  food: { en: 'Food', vi: 'Ẩm Thực', es: 'Comida', pt: 'Comida', ja: '食べ物', ko: '음식' },
  fitness: { en: 'Fitness', vi: 'Thể Dục', es: 'Fitness', pt: 'Fitness', ja: 'フィットネス', ko: '피트니스' },
  adventure: { en: 'Adventure', vi: 'Phiêu Lưu', es: 'Aventura', pt: 'Aventura', ja: '冒険', ko: '모험' },
  culture: { en: 'Culture', vi: 'Văn Hóa', es: 'Cultura', pt: 'Cultura', ja: '文化', ko: '문화' },
  family: { en: 'Family', vi: 'Gia Đình', es: 'Familia', pt: 'Família', ja: '家族', ko: '가족' },
};

const TYPE_NAMES: Record<string, Record<string, string>> = {
  story: { en: 'Story', vi: 'Câu Chuyện', es: 'Historia', pt: 'História', ja: 'ストーリー', ko: '스토리' },
  travel: { en: 'Travel', vi: 'Du Lịch', es: 'Viaje', pt: 'Viagem', ja: '旅行', ko: '여행' },
  trend: { en: 'Trending', vi: 'Xu Hướng', es: 'Tendencia', pt: 'Tendência', ja: 'トレンド', ko: '트렌드' },
  sexy: { en: 'Sexy', vi: 'Quyến Rũ', es: 'Sexy', pt: 'Sexy', ja: 'セクシー', ko: '섹시' },
  business: { en: 'Business', vi: 'Công Việc', es: 'Negocio', pt: 'Negócio', ja: 'ビジネス', ko: '비즈니스' },
  traditional: { en: 'Traditional', vi: 'Truyền Thống', es: 'Tradicional', pt: 'Tradicional', ja: '伝統', ko: '전통' },
};

const GENDER_NAMES: Record<string, Record<string, string>> = {
  all: { en: 'All', vi: 'Tất Cả', es: 'Todos', pt: 'Todos', ja: 'すべて', ko: '전체' },
  female: { en: 'Female', vi: 'Nữ', es: 'Mujer', pt: 'Mulher', ja: '女性', ko: '여성' },
  male: { en: 'Male', vi: 'Nam', es: 'Hombre', pt: 'Homem', ja: '男性', ko: '남성' },
  couple: { en: 'Couple', vi: 'Cặp Đôi', es: 'Pareja', pt: 'Casal', ja: 'カップル', ko: '커플' },
};

const DURATION_NAMES: Record<string, Record<string, string>> = {
  moment: { en: 'Moment', vi: 'Khoảnh Khắc', es: 'Momento', pt: 'Momento', ja: '一瞬', ko: '순간' },
  once: { en: 'One Day', vi: 'Một Ngày', es: 'Un Día', pt: 'Um Dia', ja: '一日', ko: '하루' },
  many: { en: 'Journey', vi: 'Hành Trình', es: 'Viaje', pt: 'Jornada', ja: '旅', ko: '여정' },
};

// ── Build JSON from batch defs ──────────────────────────────────────────────
function buildStoriesJson(): StoriesResponse {
  const batchFiles = fs.readdirSync(BATCH_DEFS_DIR)
    .filter(f => f.startsWith('batch_') && f.endsWith('.json'))
    .sort();

  console.log(`\n📁 Loading ${batchFiles.length} batch files from ${BATCH_DEFS_DIR}\n`);

  const allStories: BuiltStory[] = [];
  let offset = 0;
  const usedCategories = new Set<string>();
  const usedTypes = new Set<string>();
  const usedGenders = new Set<string>();
  const usedDurations = new Set<string>();

  for (const file of batchFiles) {
    const filePath = path.join(BATCH_DEFS_DIR, file);
    const defs: BatchStoryDef[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`  ${file}: ${defs.length} stories`);

    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      const num = offset + i + 1;
      const id = `s${String(num).padStart(3, '0')}`;
      const now = new Date().toISOString();

      usedCategories.add(d.cat);
      usedTypes.add(d.type);
      usedGenders.add(d.gender);
      usedDurations.add(d.dur);

      const chapters: BuiltChapter[] = d.chs.map((ch, ci) => ({
        order: ci + 1,
        heading: { en: ch[0], vi: ch[1] },
        text: { en: ch[2], vi: ch[3] },           // "text" matches ChapterData model
        choices: {},                                // empty for preset stories
        prompt: {
          base: ch[4],
          negative: d.neg,
          styleHint: d.style,
        },
        aiConfig: {
          model: 'imagen-3.0-generate-001',
          guidanceScale: d.gs,
          aspectRatio: '9:16',
          referenceType: 'subject',
        },
      }));

      // Preview = first 3 chapter images
      const previewImages = chapters.slice(0, 3).map(
        (_, ci) => `${IMAGES_GCS_PREFIX}/${id}/ch${ci + 1}.webp`,
      );

      allStories.push({
        id,
        slug: d.slug,
        title: { en: d.title[0], vi: d.title[1] },
        description: { en: d.desc[0], vi: d.desc[1] },
        category: d.cat,
        type: d.type,
        gender: d.gender,
        duration: d.dur,
        totalPics: chapters.length,
        credits: d.premium ? (chapters.length > 6 ? 15 : 10) : (chapters.length > 6 ? 8 : 5),
        badge: d.badge,
        premium: d.premium,
        isActive: true,
        sortOrder: num,
        coverImage: `${IMAGES_GCS_PREFIX}/${id}/ch1.webp`,
        previewImages,
        chapters,
        tags: d.tags,
        stats: { likes: 0, views: 0, generates: 0 },
        createdAt: now,
        updatedAt: now,
      });
    }

    offset += defs.length;
  }

  const now = new Date().toISOString();
  return {
    version: VERSION,
    updatedAt: now,
    imageBaseUrl: IMAGE_BASE_URL,
    imageSuffix: IMAGE_SUFFIX,
    categories: [...usedCategories].sort().map(id => ({
      id,
      name: CATEGORY_NAMES[id] || { en: id },
    })),
    types: [...usedTypes].sort().map(id => ({
      id,
      name: TYPE_NAMES[id] || { en: id },
    })),
    genders: [...usedGenders].sort().map(id => ({
      id,
      name: GENDER_NAMES[id] || { en: id },
    })),
    durations: [...usedDurations].sort().map(id => ({
      id,
      name: DURATION_NAMES[id] || { en: id },
    })),
    stories: allStories,
  };
}

// ── Upload JSON ─────────────────────────────────────────────────────────────
function uploadJson(response: StoriesResponse): void {
  const jsonData = JSON.stringify(response, null, 2);
  const tmpFile = path.join(WEBP_DIR, '_stories.json');
  fs.writeFileSync(tmpFile, jsonData, 'utf-8');

  gcsUpload(tmpFile, STORIES_GCS_PATH, 'application/json');

  const totalChapters = response.stories.reduce((sum, s) => sum + s.chapters.length, 0);
  console.log(`\n✅ JSON uploaded: ${BUCKET}/${STORIES_GCS_PATH}`);
  console.log(`   ${response.stories.length} stories, ${totalChapters} chapters, ${(jsonData.length / 1024).toFixed(1)} KB`);
}

// ── Convert + Upload Images ─────────────────────────────────────────────────
async function uploadImages(
  stories: BuiltStory[],
  skipExisting: boolean,
): Promise<void> {
  let uploaded = 0;
  let skipped = 0;
  let missing = 0;
  let totalPngBytes = 0;
  let totalWebpBytes = 0;
  const total = stories.reduce((sum, s) => sum + s.chapters.length, 0);

  console.log(`\n📸 Converting PNG → WebP (quality ${WEBP_QUALITY}) + uploading story images (${total} files)...\n`);

  for (const s of stories) {
    for (const ch of s.chapters) {
      const localPng = path.join(IMAGES_DIR, `story_${s.id}_ch${ch.order}.png`);
      const gcsPath = `${IMAGES_GCS_PREFIX}/${s.id}/ch${ch.order}.webp`;

      if (!fs.existsSync(localPng)) {
        missing++;
        continue;
      }

      if (skipExisting && gcsExists(gcsPath)) {
        skipped++;
        continue;
      }

      const webpSubDir = path.join(WEBP_DIR, s.id);
      if (!fs.existsSync(webpSubDir)) fs.mkdirSync(webpSubDir, { recursive: true });
      const webpFile = path.join(webpSubDir, `ch${ch.order}.webp`);

      process.stdout.write(`  ⬆ ${s.id}/ch${ch.order}.webp ...`);

      const pngSize = fs.statSync(localPng).size;
      await sharp(localPng).webp({ quality: WEBP_QUALITY }).toFile(webpFile);
      const webpSize = fs.statSync(webpFile).size;
      totalPngBytes += pngSize;
      totalWebpBytes += webpSize;

      gcsUpload(webpFile, gcsPath, 'image/webp');
      uploaded++;

      const savings = ((1 - webpSize / pngSize) * 100).toFixed(0);
      console.log(` done (${(pngSize/1024).toFixed(0)}KB → ${(webpSize/1024).toFixed(0)}KB, -${savings}%)`);
    }
  }

  const totalSavings = totalPngBytes > 0 ? ((1 - totalWebpBytes / totalPngBytes) * 100).toFixed(1) : '0';
  console.log(`\n📊 Images: uploaded=${uploaded}, skipped=${skipped}, missing=${missing}, total=${total}`);
  console.log(`📦 Size: ${(totalPngBytes/1024/1024).toFixed(1)}MB PNG → ${(totalWebpBytes/1024/1024).toFixed(1)}MB WebP (${totalSavings}% saved)`);
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const jsonOnly = args.includes('--json-only');
  const imagesOnly = args.includes('--images-only');
  const skipExisting = args.includes('--skip-existing');

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        FlexTale Stories Deploy (WebP)                  ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Bucket:  ${BUCKET.padEnd(45)}║`);
  console.log(`║  Mode:    ${dryRun ? 'DRY RUN' : jsonOnly ? 'JSON ONLY' : imagesOnly ? 'IMAGES ONLY' : 'FULL DEPLOY'}${' '.repeat(46 - (dryRun ? 7 : jsonOnly ? 9 : imagesOnly ? 11 : 11))}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  // Build JSON
  const response = buildStoriesJson();
  const stories = response.stories;
  const totalChapters = stories.reduce((sum, s) => sum + s.chapters.length, 0);

  // Write local JSON
  const outputDir = path.dirname(OUTPUT_JSON);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(response, null, 2), 'utf-8');
  console.log(`\n📄 Local JSON: ${OUTPUT_JSON}`);
  console.log(`   ${stories.length} stories, ${totalChapters} chapters, ${(fs.statSync(OUTPUT_JSON).size / 1024).toFixed(1)} KB`);

  // Stats
  const cats: Record<string, number> = {};
  const genders: Record<string, number> = {};
  stories.forEach(s => {
    cats[s.category] = (cats[s.category] || 0) + 1;
    genders[s.gender] = (genders[s.gender] || 0) + 1;
  });
  console.log('\n   Categories:', Object.entries(cats).map(([k, v]) => `${k}(${v})`).join(', '));
  console.log('   Genders:', Object.entries(genders).map(([k, v]) => `${k}(${v})`).join(', '));
  console.log('   Premium:', stories.filter(s => s.premium).length, '/', stories.length);
  console.log('   Filters:', response.categories.length, 'cats,', response.types.length, 'types,', response.genders.length, 'genders,', response.durations.length, 'durations');

  // Check images
  let existingImages = 0;
  stories.forEach(s => {
    s.chapters.forEach(ch => {
      const f = path.join(IMAGES_DIR, `story_${s.id}_ch${ch.order}.png`);
      if (fs.existsSync(f)) existingImages++;
    });
  });
  console.log(`   Images ready: ${existingImages}/${totalChapters}`);

  if (dryRun) {
    console.log('\n🔍 Dry run complete. No files uploaded.');
    return;
  }

  if (!fs.existsSync(WEBP_DIR)) fs.mkdirSync(WEBP_DIR, { recursive: true });

  if (!imagesOnly) {
    uploadJson(response);
  }

  if (!jsonOnly) {
    await uploadImages(stories, skipExisting);
  }

  console.log('\n🎉 Deploy complete!');

  console.log(`\nJSON URL:`);
  console.log(`  ${IMAGE_BASE_URL}${encodeURIComponent(STORIES_GCS_PATH)}${IMAGE_SUFFIX}`);
}

main().catch(err => {
  console.error('❌ Error:', err.message || err);
  process.exit(1);
});
