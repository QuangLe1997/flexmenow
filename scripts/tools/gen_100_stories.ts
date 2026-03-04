/**
 * gen_100_stories.ts
 *
 * Reads story definitions from JSON batch files in data/story_defs/
 * and builds the final flextale_stories.json output.
 *
 * Story data is separated from logic:
 *   - data/story_defs/batch_*.json  → story definitions (editable data)
 *   - this script                    → build logic (reads JSON, outputs final JSON)
 *
 * Usage:
 *   cd scripts && npx ts-node tools/gen_100_stories.ts
 *   cd scripts && npx ts-node tools/gen_100_stories.ts --batch batch_1_travel_wealth
 *   cd scripts && npx ts-node tools/gen_100_stories.ts --batch batch_3_pet_emotion --offset 47
 */

import * as fs from 'fs';
import * as path from 'path';

const DEFS_DIR = path.resolve(__dirname, '../data/story_defs');
const OUTPUT = path.resolve(__dirname, '../../public/config/flextale_stories.json');

// ── Types ────────────────────────────────────────────────────────────────────

type Ch = [string, string, string, string, string]; // [hEN, hVI, tEN, tVI, prompt]

interface StoryDef {
  slug: string;
  title: [string, string]; // [en, vi]
  desc: [string, string];
  cat: string; type: string; gender: string;
  dur: 'moment' | 'once' | 'many';
  badge: string | null; premium: boolean;
  neg: string; style: string; gs: number;
  tags: string[];
  chs: Ch[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const CHOICE_POOLS: Record<string, [string[], string[]]> = {
  travel: [
    ['Take me back!', 'Living the dream', 'Best trip ever', 'Wanderlust hits different', 'Need to go back', 'Bucket list checked'],
    ['Quay lại đi!', 'Sống như mơ', 'Chuyến đi tuyệt nhất', 'Đi hoài không chán', 'Phải quay lại', 'Check xong bucket list'],
  ],
  wealth: [
    ['Boss moves only', 'Money talks', 'Living large', 'Flex mode on', 'This is the life', 'Work hard play hard'],
    ['Chỉ có boss mới hiểu', 'Tiền nói lên tất cả', 'Sống sang', 'Flex thôi', 'Đây mới là cuộc sống', 'Làm hết mình chơi hết sức'],
  ],
  beauty: [
    ['Glow up season', 'Slay all day', 'That glow tho', 'Beauty is power', 'Confidence level: 100', 'Main character vibes'],
    ['Mùa lên đời', 'Slay cả ngày', 'Da đẹp quá', 'Đẹp là quyền lực', 'Tự tin level max', 'Nhân vật chính đây'],
  ],
  couple: [
    ['Couple goals', 'My person', 'Love wins', 'Better together', 'You and me', 'Heart is full'],
    ['Couple mục tiêu', 'Người của tôi', 'Tình yêu thắng', 'Bên nhau là đủ', 'Anh và em', 'Tim đầy ắp'],
  ],
  pet: [
    ['Best friend ever', 'Pet parent life', 'So precious', 'My baby', 'Unconditional love', 'Paws and love'],
    ['Bạn thân nhất', 'Cuộc sống sen', 'Quá đáng yêu', 'Con cưng', 'Yêu không điều kiện', 'Chân và tình yêu'],
  ],
  emotion: [
    ['In my feels', 'This hits different', 'Character development', 'New chapter', 'Plot twist', 'Main character energy'],
    ['Trong cảm xúc', 'Cảm giác khác biệt', 'Phát triển bản thân', 'Chương mới', 'Bước ngoặt', 'Năng lượng nhân vật chính'],
  ],
  lifestyle: [
    ['Living my best life', 'This is the vibe', 'Daily aesthetic', 'Life update', 'Good vibes only', 'Core memory'],
    ['Sống hết mình', 'Đây là vibes', 'Thẩm mỹ hàng ngày', 'Cập nhật cuộc sống', 'Chỉ có good vibes', 'Kỷ niệm đáng nhớ'],
  ],
  career: [
    ['Hard work pays off', 'Boss energy', 'Level up', 'Dream big', 'Making moves', 'Built different'],
    ['Nỗ lực được đền đáp', 'Năng lượng boss', 'Lên level', 'Mơ lớn', 'Đang tiến lên', 'Khác biệt'],
  ],
  trending: [
    ['So aesthetic', 'The vibe is immaculate', 'Living in a movie', 'Iconic', 'No thoughts just vibes', 'This era hits'],
    ['Thẩm mỹ quá', 'Vibes hoàn hảo', 'Sống trong phim', 'Huyền thoại', 'Không suy nghĩ chỉ vibes', 'Era này đỉnh'],
  ],
  seasonal: [
    ['Tis the season', 'Holiday mode on', 'Festive vibes', 'Best time of year', 'Celebrate!', 'Making memories'],
    ['Đúng mùa rồi', 'Chế độ lễ hội', 'Vibes lễ hội', 'Thời điểm đẹp nhất năm', 'Ăn mừng thôi!', 'Tạo kỷ niệm'],
  ],
};

function getChoices(cat: string, chapterIdx: number): { en: string[]; vi: string[] } {
  const pool = CHOICE_POOLS[cat] || CHOICE_POOLS.lifestyle;
  const start = (chapterIdx * 2) % (pool[0].length - 2);
  return {
    en: pool[0].slice(start, start + 3),
    vi: pool[1].slice(start, start + 3),
  };
}

function makeStats(i: number) {
  const s = ((i + 13) * 2654435761) >>> 0;
  const likes = 1500 + (s % 12000);
  const views = likes * 3 + (s % 8000);
  const generates = Math.floor(likes * 0.5 + (s % 1500));
  return { likes, views, generates };
}

function creditsForChapters(n: number, premium: boolean): number {
  const base = n <= 6 ? 8 : n <= 7 ? 10 : n <= 8 ? 12 : 15;
  return premium ? base + 3 : base;
}

function buildStory(def: StoryDef, index: number) {
  const num = String(index + 1).padStart(3, '0');
  const id = `s${num}`;
  const totalPics = def.chs.length;
  const credits = creditsForChapters(totalPics, def.premium);

  const chapters = def.chs.map((ch, ci) => ({
    order: ci + 1,
    heading: { en: ch[0], vi: ch[1], es: '', pt: '', ja: '', ko: '' },
    text: { en: ch[2], vi: ch[3], es: '', pt: '', ja: '', ko: '' },
    choices: getChoices(def.cat, ci),
    prompt: {
      base: ch[4],
      negative: def.neg,
      styleHint: def.style,
    },
    aiConfig: {
      model: 'imagen-3.0-generate-001',
      guidanceScale: def.gs,
      aspectRatio: '3:4',
      referenceType: 'SUBJECT_REFERENCE',
    },
  }));

  return {
    id,
    title: { en: def.title[0], vi: def.title[1], es: '', pt: '', ja: '', ko: '' },
    description: { en: def.desc[0], vi: def.desc[1], es: '', pt: '', ja: '', ko: '' },
    category: def.cat,
    type: def.type,
    gender: def.gender,
    duration: def.dur,
    totalPics,
    credits,
    badge: def.badge,
    premium: def.premium,
    isActive: true,
    sortOrder: index + 1,
    coverImage: `mockup-images/stories/${id}_${def.slug}/cover.png`,
    previewImages: [
      `mockup-images/stories/${id}_${def.slug}/preview_0.png`,
      `mockup-images/stories/${id}_${def.slug}/preview_1.png`,
      `mockup-images/stories/${id}_${def.slug}/preview_2.png`,
    ],
    chapters,
    tags: def.tags,
    stats: makeStats(index),
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-02T00:00:00Z',
  };
}

// ── Load story definitions from JSON batch files ─────────────────────────────

function loadStoryDefs(batchFilter?: string): StoryDef[] {
  const files = fs.readdirSync(DEFS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort(); // alphabetical = batch order

  if (batchFilter) {
    const match = files.find(f => f.includes(batchFilter));
    if (!match) {
      console.error(`Batch "${batchFilter}" not found. Available: ${files.join(', ')}`);
      process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(path.join(DEFS_DIR, match), 'utf-8'));
    console.log(`Loaded ${data.length} stories from ${match}`);
    return data;
  }

  // Load all batches
  const all: StoryDef[] = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(DEFS_DIR, f), 'utf-8'));
    console.log(`  ${f}: ${data.length} stories`);
    all.push(...data);
  }
  return all;
}

// ── Output structure ─────────────────────────────────────────────────────────

const categories = [
  { id: 'travel', name: { en: 'Travel', vi: 'Du lịch', es: 'Viaje', pt: 'Viagem', ja: '旅行', ko: '여행' }, icon: 'plane', sortOrder: 1 },
  { id: 'wealth', name: { en: 'Flex Wealth', vi: 'Flex Giàu Sang', es: 'Riqueza', pt: 'Riqueza', ja: 'リッチ', ko: '부자' }, icon: 'crown', sortOrder: 2 },
  { id: 'beauty', name: { en: 'Flex Beauty', vi: 'Flex Nhan Sắc', es: 'Belleza', pt: 'Beleza', ja: 'ビューティー', ko: '뷰티' }, icon: 'sparkles', sortOrder: 3 },
  { id: 'couple', name: { en: 'Flex Couple', vi: 'Flex Người Yêu', es: 'Pareja', pt: 'Casal', ja: 'カップル', ko: '커플' }, icon: 'heart', sortOrder: 4 },
  { id: 'pet', name: { en: 'Flex Pet', vi: 'Flex Thú Cưng', es: 'Mascotas', pt: 'Pets', ja: 'ペット', ko: '반려동물' }, icon: 'paw', sortOrder: 5 },
  { id: 'emotion', name: { en: 'Flex Mood', vi: 'Flex Cảm Xúc', es: 'Emociones', pt: 'Emoções', ja: 'ムード', ko: '감정' }, icon: 'flame', sortOrder: 6 },
  { id: 'lifestyle', name: { en: 'Lifestyle', vi: 'Phong Cách', es: 'Estilo', pt: 'Estilo', ja: 'ライフスタイル', ko: '라이프' }, icon: 'star', sortOrder: 7 },
  { id: 'career', name: { en: 'Flex Career', vi: 'Flex Sự Nghiệp', es: 'Carrera', pt: 'Carreira', ja: 'キャリア', ko: '커리어' }, icon: 'briefcase', sortOrder: 8 },
  { id: 'trending', name: { en: 'Trending', vi: 'Xu Hướng', es: 'Tendencia', pt: 'Tendência', ja: 'トレンド', ko: '트렌드' }, icon: 'zap', sortOrder: 9 },
  { id: 'seasonal', name: { en: 'Seasonal', vi: 'Mùa Lễ', es: 'Temporada', pt: 'Sazonal', ja: '季節', ko: '시즌' }, icon: 'calendar', sortOrder: 10 },
];

const types = [
  { id: 'travel', name: { en: 'Travel', vi: 'Du lịch' } },
  { id: 'flex', name: { en: 'Flex', vi: 'Flex' } },
  { id: 'journey', name: { en: 'Journey', vi: 'Hành trình' } },
  { id: 'vlog', name: { en: 'Vlog', vi: 'Vlog' } },
  { id: 'aesthetic', name: { en: 'Aesthetic', vi: 'Thẩm mỹ' } },
  { id: 'story', name: { en: 'Story', vi: 'Câu chuyện' } },
];

const genders = [
  { id: 'all', name: { en: 'All', vi: 'Tất cả' } },
  { id: 'male', name: { en: 'Male', vi: 'Nam' } },
  { id: 'female', name: { en: 'Female', vi: 'Nữ' } },
  { id: 'couple', name: { en: 'Couple', vi: 'Cặp đôi' } },
];

const durations = [
  { id: 'moment', name: { en: 'Quick', vi: 'Nhanh' }, icon: 'zap' },
  { id: 'once', name: { en: 'One-time', vi: 'Một lần' }, icon: 'clock' },
  { id: 'many', name: { en: 'Series', vi: 'Series' }, icon: 'layers' },
];

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  // Parse CLI args
  const args = process.argv.slice(2);
  const batchIdx = args.indexOf('--batch');
  const batchFilter = batchIdx >= 0 ? args[batchIdx + 1] : undefined;
  const offsetIdx = args.indexOf('--offset');
  const offset = offsetIdx >= 0 ? parseInt(args[offsetIdx + 1], 10) : 0;

  console.log('Loading story definitions from JSON...');
  const stories = loadStoryDefs(batchFilter);
  console.log(`\nBuilding ${stories.length} stories (offset: ${offset})...`);

  const built = stories.map((s, i) => buildStory(s, i + offset));

  // Stats
  const catCount: Record<string, number> = {};
  const genCount: Record<string, number> = {};
  let totalCh = 0;
  for (const s of built) {
    catCount[s.category] = (catCount[s.category] || 0) + 1;
    genCount[s.gender] = (genCount[s.gender] || 0) + 1;
    totalCh += s.chapters.length;
  }

  console.log('\nCategory distribution:');
  for (const [k, v] of Object.entries(catCount)) console.log(`  ${k}: ${v}`);
  console.log('\nGender distribution:');
  for (const [k, v] of Object.entries(genCount)) console.log(`  ${k}: ${v}`);
  console.log(`\nTotal chapters: ${totalCh}`);
  console.log(`Total stories: ${built.length}`);

  // If building a single batch, write to a batch-specific output
  if (batchFilter) {
    const batchOut = path.resolve(__dirname, `../../public/config/flextale_${batchFilter}.json`);
    const json = JSON.stringify(built, null, 2);
    fs.writeFileSync(batchOut, json, 'utf-8');
    console.log(`\nBatch written to: ${batchOut}`);
    console.log(`File size: ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB`);
    return;
  }

  // Full build → final output
  const output = {
    version: '1.0.0',
    updatedAt: '2026-03-02T00:00:00Z',
    categories,
    types,
    genders,
    durations,
    stories: built,
    imageBaseUrl: 'https://firebasestorage.googleapis.com/v0/b/flexme-now.firebasestorage.app/o/',
    imageSuffix: '?alt=media',
  };

  const json = JSON.stringify(output, null, 2);
  fs.writeFileSync(OUTPUT, json, 'utf-8');
  console.log(`\nWritten to: ${OUTPUT}`);
  console.log(`File size: ${(Buffer.byteLength(json) / 1024).toFixed(1)} KB`);
}

main();
