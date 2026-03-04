/**
 * gen_100_templates.ts
 *
 * Reads template definitions from JSON batch files in data/template_defs/
 * and builds the final flexshot_templates.json output.
 *
 * Template data is separated from logic:
 *   - data/template_defs/batch_*.json  → template definitions (editable data)
 *   - this script                       → build logic (reads JSON, outputs final JSON)
 *
 * Usage:
 *   cd scripts && npx ts-node tools/gen_100_templates.ts
 *   cd scripts && npx ts-node tools/gen_100_templates.ts --batch batch_1_travel
 *   cd scripts && npx ts-node tools/gen_100_templates.ts --batch batch_6_new --offset 100
 *   cd scripts && npx ts-node tools/gen_100_templates.ts --append batch_6_new
 */

import * as fs from 'fs';
import * as path from 'path';

const DEFS_DIR = path.resolve(__dirname, '../data/template_defs');
const OUTPUT = path.resolve(__dirname, '../../public/config/flexshot_templates.json');

// ── Types ────────────────────────────────────────────────────────────────────

interface I18n {
  en: string;
  vi: string;
  es: string;
  pt: string;
  ja: string;
  ko: string;
}

interface TemplateDef {
  slug: string;
  name: I18n;
  category: string;
  type: string;
  gender: string;
  style: string;
  badge: 'HOT' | 'NEW' | null;
  premium: boolean;
  prompt: string;
  negative: string;
  styleHint: string;
  guidanceScale: number;
  tags: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeStats(i: number) {
  const seed = ((i + 7) * 2654435761) >>> 0;
  const likes = 2000 + (seed % 16000);
  const views = likes * 3 + (seed % 10000);
  const generates = Math.floor(likes * 0.7 + (seed % 2000));
  return { likes, views, generates };
}

function buildTemplate(def: TemplateDef, index: number) {
  const num = String(index + 1).padStart(3, '0');
  const id = `t${num}`;
  const credits = def.premium ? 2 : 1;

  const coverPath = `mockup-images/templates/gold/${id}_${def.slug}.png`;
  const viralPath = `mockup-images/templates/viral/${id}_${def.slug}.png`;

  return {
    id,
    name: def.name,
    category: def.category,
    type: def.type,
    gender: def.gender,
    style: def.style,
    credits,
    badge: def.badge,
    premium: def.premium,
    isActive: true,
    sortOrder: index + 1,
    coverImage: coverPath,
    previewImages: [coverPath, viralPath],
    prompt: {
      base: def.prompt,
      negative: def.negative,
      styleHint: def.styleHint,
    },
    aiConfig: {
      model: 'imagen-3.0-generate-001',
      guidanceScale: def.guidanceScale,
      aspectRatio: '3:4',
      numberOfImages: 1,
      safetyFilterLevel: 'BLOCK_MEDIUM_AND_ABOVE',
      referenceType: 'SUBJECT_REFERENCE',
      seed: null,
    },
    stats: makeStats(index),
    tags: def.tags,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-02T00:00:00Z',
  };
}

// ── Load template definitions from JSON batch files ──────────────────────────

function loadTemplateDefs(batchFilter?: string): TemplateDef[] {
  const files = fs.readdirSync(DEFS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  if (batchFilter) {
    const match = files.find(f => f.includes(batchFilter));
    if (!match) {
      console.error(`Batch "${batchFilter}" not found. Available: ${files.join(', ')}`);
      process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(path.join(DEFS_DIR, match), 'utf-8'));
    console.log(`Loaded ${data.length} templates from ${match}`);
    return data;
  }

  // Load all batches
  const all: TemplateDef[] = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(DEFS_DIR, f), 'utf-8'));
    console.log(`  ${f}: ${data.length} templates`);
    all.push(...data);
  }
  return all;
}

// ── Output structure ─────────────────────────────────────────────────────────

const categories = [
  { id: 'travel', name: { en: 'Travel', vi: 'Du lịch', es: 'Viaje', pt: 'Viagem', ja: '旅行', ko: '여행' }, icon: 'camera', sortOrder: 1 },
  { id: 'luxury', name: { en: 'Luxury', vi: 'Sang trọng', es: 'Lujo', pt: 'Luxo', ja: 'ラグジュアリー', ko: '럭셔리' }, icon: 'crown', sortOrder: 2 },
  { id: 'lifestyle', name: { en: 'Lifestyle', vi: 'Phong cách', es: 'Estilo de vida', pt: 'Estilo de vida', ja: 'ライフスタイル', ko: '라이프스타일' }, icon: 'sparkles', sortOrder: 3 },
  { id: 'art', name: { en: 'Art', vi: 'Nghệ thuật', es: 'Arte', pt: 'Arte', ja: 'アート', ko: '아트' }, icon: 'palette', sortOrder: 4 },
  { id: 'seasonal', name: { en: 'Seasonal', vi: 'Mùa lễ', es: 'Temporada', pt: 'Sazonal', ja: '季節', ko: '시즌' }, icon: 'flame', sortOrder: 5 },
];

const types = [
  { id: 'travel', name: { en: 'Travel', vi: 'Du lịch', es: 'Viaje', pt: 'Viagem', ja: '旅行', ko: '여행' } },
  { id: 'sexy', name: { en: 'Sexy', vi: 'Quyến rũ', es: 'Sexy', pt: 'Sexy', ja: 'セクシー', ko: '섹시' } },
  { id: 'business', name: { en: 'Business', vi: 'Doanh nhân', es: 'Negocios', pt: 'Negócios', ja: 'ビジネス', ko: '비즈니스' } },
  { id: 'trend', name: { en: 'Trending', vi: 'Xu hướng', es: 'Tendencia', pt: 'Tendência', ja: 'トレンド', ko: '트렌드' } },
  { id: 'traditional', name: { en: 'Traditional', vi: 'Truyền thống', es: 'Tradicional', pt: 'Tradicional', ja: '伝統的', ko: '전통' } },
];

const genders = [
  { id: 'all', name: { en: 'All', vi: 'Tất cả', es: 'Todos', pt: 'Todos', ja: 'すべて', ko: '모두' } },
  { id: 'male', name: { en: 'Male', vi: 'Nam', es: 'Hombre', pt: 'Masculino', ja: '男性', ko: '남성' } },
  { id: 'female', name: { en: 'Female', vi: 'Nữ', es: 'Mujer', pt: 'Feminino', ja: '女性', ko: '여성' } },
  { id: 'couple', name: { en: 'Couple', vi: 'Cặp đôi', es: 'Pareja', pt: 'Casal', ja: 'カップル', ko: '커플' } },
];

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const batchIdx = args.indexOf('--batch');
  const batchFilter = batchIdx >= 0 ? args[batchIdx + 1] : undefined;
  const offsetIdx = args.indexOf('--offset');
  const offset = offsetIdx >= 0 ? parseInt(args[offsetIdx + 1], 10) : 0;
  const appendIdx = args.indexOf('--append');
  const appendBatch = appendIdx >= 0 ? args[appendIdx + 1] : undefined;

  // ── Append mode: add new batch to existing output ──
  if (appendBatch) {
    if (!fs.existsSync(OUTPUT)) {
      console.error('Cannot append: output file does not exist. Run full build first.');
      process.exit(1);
    }

    const existing = JSON.parse(fs.readFileSync(OUTPUT, 'utf-8'));
    const existingCount = existing.templates.length;
    const appendOffset = offsetIdx >= 0 ? offset : existingCount;

    console.log(`Appending batch "${appendBatch}" to existing ${existingCount} templates (offset: ${appendOffset})...\n`);

    const newDefs = loadTemplateDefs(appendBatch);
    const newBuilt = newDefs.map((d, i) => buildTemplate(d, i + appendOffset));

    // Check for duplicate IDs
    const existingIds = new Set(existing.templates.map((t: any) => t.id));
    for (const t of newBuilt) {
      if (existingIds.has(t.id)) {
        console.error(`ERROR: Duplicate ID ${t.id}. Use --offset ${existingCount} or higher.`);
        process.exit(1);
      }
    }

    existing.templates.push(...newBuilt);
    existing.updatedAt = new Date().toISOString();

    const json = JSON.stringify(existing, null, 2);
    fs.writeFileSync(OUTPUT, json, 'utf-8');
    console.log(`\nAppended ${newBuilt.length} templates. Total: ${existing.templates.length}`);
    console.log(`Written to: ${OUTPUT}`);
    console.log(`File size: ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB`);
    return;
  }

  // ── Normal mode: build from batches ──
  console.log('Loading template definitions from JSON...\n');
  const defs = loadTemplateDefs(batchFilter);
  console.log(`\nBuilding ${defs.length} templates (offset: ${offset})...`);

  const built = defs.map((d, i) => buildTemplate(d, i + offset));

  // Stats
  const catCount: Record<string, number> = {};
  const genCount: Record<string, number> = {};
  const badgeCount: Record<string, number> = { HOT: 0, NEW: 0, none: 0 };
  let premiumCount = 0;

  for (const t of built) {
    catCount[t.category] = (catCount[t.category] || 0) + 1;
    genCount[t.gender] = (genCount[t.gender] || 0) + 1;
    if (t.badge === 'HOT') badgeCount.HOT++;
    else if (t.badge === 'NEW') badgeCount.NEW++;
    else badgeCount.none++;
    if (t.premium) premiumCount++;
  }

  console.log('\nCategory distribution:');
  for (const [k, v] of Object.entries(catCount)) console.log(`  ${k}: ${v}`);
  console.log('\nGender distribution:');
  for (const [k, v] of Object.entries(genCount)) console.log(`  ${k}: ${v}`);
  console.log('\nBadge distribution:');
  for (const [k, v] of Object.entries(badgeCount)) console.log(`  ${k}: ${v}`);
  console.log(`\nPremium: ${premiumCount} / Standard: ${built.length - premiumCount}`);
  console.log(`Total templates: ${built.length}`);

  // Single batch → batch-specific output
  if (batchFilter) {
    const batchOut = path.resolve(__dirname, `../../public/config/flexshot_${batchFilter}.json`);
    const json = JSON.stringify(built, null, 2);
    fs.writeFileSync(batchOut, json, 'utf-8');
    console.log(`\nBatch written to: ${batchOut}`);
    console.log(`File size: ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB`);
    return;
  }

  // Full build → final output
  const output = {
    version: '2.0.0',
    updatedAt: new Date().toISOString(),
    defaults: {
      creditsPerTemplate: 1,
      premiumCreditsPerTemplate: 2,
    },
    categories,
    types,
    genders,
    templates: built,
    imageBaseUrl: 'https://firebasestorage.googleapis.com/v0/b/flexme-now.firebasestorage.app/o/',
    imageSuffix: '?alt=media',
  };

  const json = JSON.stringify(output, null, 2);
  fs.writeFileSync(OUTPUT, json, 'utf-8');
  console.log(`\nWritten to: ${OUTPUT}`);
  console.log(`File size: ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB`);
}

main();
