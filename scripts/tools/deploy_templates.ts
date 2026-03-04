/**
 * deploy_templates.ts
 *
 * Build flexshot_templates.json from all batch defs, convert PNG→WebP, upload to GCS.
 * Output JSON matches TemplatesResponse format expected by the Flutter app.
 *
 * Usage:
 *   npx ts-node tools/deploy_templates.ts                    # build + upload all
 *   npx ts-node tools/deploy_templates.ts --dry-run          # preview only
 *   npx ts-node tools/deploy_templates.ts --json-only        # upload JSON only (no images)
 *   npx ts-node tools/deploy_templates.ts --images-only      # upload images only (no JSON)
 *   npx ts-node tools/deploy_templates.ts --skip-existing    # skip already uploaded images
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
const TEMPLATES_GCS_PATH = 'config/flexshot_templates.json';
const IMAGES_GCS_PREFIX = 'mockup-images/templates';
const BATCH_DEFS_DIR = path.resolve(__dirname, '../data/template_defs');
const OUTPUT_JSON = path.resolve(__dirname, '../../public/config/flexshot_templates.json');
const IMAGES_DIR = path.resolve(__dirname, '../../generated_images');
const WEBP_DIR = path.resolve(__dirname, '../../generated_images/webp');
const WEBP_QUALITY = 82;
const VERSION = '1.0.0';

// ── Types ───────────────────────────────────────────────────────────────────
interface BatchTemplateDef {
  slug: string;
  name: Record<string, string>;
  category: string;
  type: string;
  gender: string;
  style: string;
  badge: string | null;
  premium: boolean;
  prompt: string;
  negative: string;
  styleHint: string;
  guidanceScale: number;
  tags: string[];
}

// Matches TemplateData in Flutter app
interface BuiltTemplate {
  id: string;
  slug: string;
  name: Record<string, string>;
  category: string;
  type: string;
  gender: string;
  style: string;
  credits: number;
  badge: string | null;
  premium: boolean;
  isActive: boolean;
  sortOrder: number;
  coverImage: string;
  previewImages: string[];
  prompt: { base: string; negative: string; styleHint: string };
  aiConfig: {
    model: string;
    guidanceScale: number;
    numInferenceSteps: number;
    aspectRatios: string[];
  };
  stats: { likes: number; views: number; generates: number };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Matches TemplatesResponse in Flutter app
interface TemplatesResponse {
  version: string;
  updatedAt: string;
  imageBaseUrl: string;
  imageSuffix: string;
  defaults: { creditsPerTemplate: number; premiumCreditsPerTemplate: number };
  categories: { id: string; name: Record<string, string> }[];
  types: { id: string; name: Record<string, string> }[];
  genders: { id: string; name: Record<string, string> }[];
  templates: BuiltTemplate[];
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
  travel: { en: 'Travel', vi: 'Du Lịch', es: 'Viaje', pt: 'Viagem', ja: '旅行', ko: '여행' },
  luxury: { en: 'Luxury', vi: 'Sang Trọng', es: 'Lujo', pt: 'Luxo', ja: 'ラグジュアリー', ko: '럭셔리' },
  lifestyle: { en: 'Lifestyle', vi: 'Phong Cách', es: 'Estilo', pt: 'Estilo', ja: 'ライフスタイル', ko: '라이프스타일' },
  art: { en: 'Art', vi: 'Nghệ Thuật', es: 'Arte', pt: 'Arte', ja: 'アート', ko: '아트' },
  seasonal: { en: 'Seasonal', vi: 'Mùa', es: 'Temporada', pt: 'Temporada', ja: '季節', ko: '시즌' },
  professional: { en: 'Professional', vi: 'Chuyên Nghiệp', es: 'Profesional', pt: 'Profissional', ja: 'プロフェッショナル', ko: '프로페셔널' },
  artistic: { en: 'Artistic', vi: 'Nghệ Sĩ', es: 'Artístico', pt: 'Artístico', ja: 'アーティスティック', ko: '예술적' },
  creative: { en: 'Creative', vi: 'Sáng Tạo', es: 'Creativo', pt: 'Criativo', ja: 'クリエイティブ', ko: '크리에이티브' },
  cultural: { en: 'Cultural', vi: 'Văn Hóa', es: 'Cultural', pt: 'Cultural', ja: '文化', ko: '문화' },
};

const TYPE_NAMES: Record<string, Record<string, string>> = {
  travel: { en: 'Travel', vi: 'Du Lịch', es: 'Viaje', pt: 'Viagem', ja: '旅行', ko: '여행' },
  sexy: { en: 'Sexy', vi: 'Quyến Rũ', es: 'Sexy', pt: 'Sexy', ja: 'セクシー', ko: '섹시' },
  business: { en: 'Business', vi: 'Công Việc', es: 'Negocio', pt: 'Negócio', ja: 'ビジネス', ko: '비즈니스' },
  trend: { en: 'Trending', vi: 'Xu Hướng', es: 'Tendencia', pt: 'Tendência', ja: 'トレンド', ko: '트렌드' },
  traditional: { en: 'Traditional', vi: 'Truyền Thống', es: 'Tradicional', pt: 'Tradicional', ja: '伝統', ko: '전통' },
};

const GENDER_NAMES: Record<string, Record<string, string>> = {
  all: { en: 'All', vi: 'Tất Cả', es: 'Todos', pt: 'Todos', ja: 'すべて', ko: '전체' },
  female: { en: 'Female', vi: 'Nữ', es: 'Mujer', pt: 'Mulher', ja: '女性', ko: '여성' },
  male: { en: 'Male', vi: 'Nam', es: 'Hombre', pt: 'Homem', ja: '男性', ko: '남성' },
  couple: { en: 'Couple', vi: 'Cặp Đôi', es: 'Pareja', pt: 'Casal', ja: 'カップル', ko: '커플' },
};

// ── Build JSON from batch defs ──────────────────────────────────────────────
function buildTemplatesJson(): TemplatesResponse {
  const batchFiles = fs.readdirSync(BATCH_DEFS_DIR)
    .filter(f => f.startsWith('batch_') && f.endsWith('.json'))
    .sort();

  console.log(`\n📁 Loading ${batchFiles.length} batch files from ${BATCH_DEFS_DIR}\n`);

  const allTemplates: BuiltTemplate[] = [];
  let offset = 0;
  const usedCategories = new Set<string>();
  const usedTypes = new Set<string>();
  const usedGenders = new Set<string>();

  for (const file of batchFiles) {
    const filePath = path.join(BATCH_DEFS_DIR, file);
    const defs: BatchTemplateDef[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`  ${file}: ${defs.length} templates`);

    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      const num = offset + i + 1;
      const id = `t${String(num).padStart(3, '0')}`;
      const now = new Date().toISOString();
      const coverPath = `${IMAGES_GCS_PREFIX}/${id}_cover.webp`;
      const viralPath = `${IMAGES_GCS_PREFIX}/${id}_viral.webp`;

      usedCategories.add(d.category);
      usedTypes.add(d.type);
      usedGenders.add(d.gender);

      allTemplates.push({
        id,
        slug: d.slug,
        name: d.name,
        category: d.category,
        type: d.type,
        gender: d.gender,
        style: d.style,
        credits: d.premium ? 2 : 1,
        badge: d.badge,
        premium: d.premium,
        isActive: true,
        sortOrder: num,
        coverImage: coverPath,
        previewImages: [coverPath, viralPath],
        prompt: {
          base: d.prompt,
          negative: d.negative,
          styleHint: d.styleHint,
        },
        aiConfig: {
          model: 'imagen-3.0-generate-001',
          guidanceScale: d.guidanceScale,
          numInferenceSteps: 50,
          aspectRatios: ['1:1', '9:16', '16:9'],
        },
        stats: { likes: 0, views: 0, generates: 0 },
        tags: d.tags,
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
    defaults: { creditsPerTemplate: 1, premiumCreditsPerTemplate: 2 },
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
    templates: allTemplates,
  };
}

// ── Upload JSON ─────────────────────────────────────────────────────────────
function uploadJson(response: TemplatesResponse): void {
  const jsonData = JSON.stringify(response, null, 2);
  const tmpFile = path.join(WEBP_DIR, '_templates.json');
  fs.writeFileSync(tmpFile, jsonData, 'utf-8');

  gcsUpload(tmpFile, TEMPLATES_GCS_PATH, 'application/json');

  console.log(`\n✅ JSON uploaded: ${BUCKET}/${TEMPLATES_GCS_PATH}`);
  console.log(`   ${response.templates.length} templates, ${(jsonData.length / 1024).toFixed(1)} KB`);
}

// ── Convert + Upload Images ─────────────────────────────────────────────────
async function uploadImages(
  templates: BuiltTemplate[],
  skipExisting: boolean,
): Promise<void> {
  let uploaded = 0;
  let skipped = 0;
  let missing = 0;
  let totalPngBytes = 0;
  let totalWebpBytes = 0;
  const total = templates.length * 2;

  console.log(`\n📸 Converting PNG → WebP (quality ${WEBP_QUALITY}) + uploading (${total} files)...\n`);

  for (const t of templates) {
    for (const variant of ['cover', 'viral'] as const) {
      const localPng = path.join(IMAGES_DIR, `template_${t.id}_${variant}.png`);
      const gcsPath = `${IMAGES_GCS_PREFIX}/${t.id}_${variant}.webp`;

      if (!fs.existsSync(localPng)) {
        console.log(`  ⚠ MISSING: template_${t.id}_${variant}.png`);
        missing++;
        continue;
      }

      if (skipExisting && gcsExists(gcsPath)) {
        skipped++;
        continue;
      }

      const webpFile = path.join(WEBP_DIR, `template_${t.id}_${variant}.webp`);
      process.stdout.write(`  ⬆ ${t.id}_${variant}.webp ...`);

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
  console.log('║        FlexShot Templates Deploy (WebP)                ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Bucket:  ${BUCKET.padEnd(45)}║`);
  console.log(`║  Mode:    ${dryRun ? 'DRY RUN' : jsonOnly ? 'JSON ONLY' : imagesOnly ? 'IMAGES ONLY' : 'FULL DEPLOY'}${' '.repeat(46 - (dryRun ? 7 : jsonOnly ? 9 : imagesOnly ? 11 : 11))}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  // Step 1: Build JSON
  const response = buildTemplatesJson();
  const templates = response.templates;

  // Write local JSON
  const outputDir = path.dirname(OUTPUT_JSON);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(response, null, 2), 'utf-8');
  console.log(`\n📄 Local JSON: ${OUTPUT_JSON}`);
  console.log(`   ${templates.length} templates, ${(fs.statSync(OUTPUT_JSON).size / 1024).toFixed(1)} KB`);

  // Stats
  const cats: Record<string, number> = {};
  const genders: Record<string, number> = {};
  templates.forEach(t => {
    cats[t.category] = (cats[t.category] || 0) + 1;
    genders[t.gender] = (genders[t.gender] || 0) + 1;
  });
  console.log('\n   Categories:', Object.entries(cats).map(([k, v]) => `${k}(${v})`).join(', '));
  console.log('   Genders:', Object.entries(genders).map(([k, v]) => `${k}(${v})`).join(', '));
  console.log('   Premium:', templates.filter(t => t.premium).length, '/', templates.length);
  console.log('   Filters:', response.categories.length, 'categories,', response.types.length, 'types,', response.genders.length, 'genders');

  // Check images
  const existingImages = templates.reduce((count, t) => {
    const cover = path.join(IMAGES_DIR, `template_${t.id}_cover.png`);
    const viral = path.join(IMAGES_DIR, `template_${t.id}_viral.png`);
    return count + (fs.existsSync(cover) ? 1 : 0) + (fs.existsSync(viral) ? 1 : 0);
  }, 0);
  console.log(`   Images ready: ${existingImages}/${templates.length * 2}`);

  if (dryRun) {
    console.log('\n🔍 Dry run complete. No files uploaded.');
    return;
  }

  if (!fs.existsSync(WEBP_DIR)) fs.mkdirSync(WEBP_DIR, { recursive: true });

  if (!imagesOnly) {
    uploadJson(response);
  }

  if (!jsonOnly) {
    await uploadImages(templates, skipExisting);
  }

  console.log('\n🎉 Deploy complete!');

  const sample = templates[0];
  console.log(`\nSample image URL:`);
  console.log(`  ${IMAGE_BASE_URL}${encodeURIComponent(sample.coverImage)}${IMAGE_SUFFIX}`);
  console.log(`\nJSON URL:`);
  console.log(`  ${IMAGE_BASE_URL}${encodeURIComponent(TEMPLATES_GCS_PATH)}${IMAGE_SUFFIX}`);
}

main().catch(err => {
  console.error('❌ Error:', err.message || err);
  process.exit(1);
});
