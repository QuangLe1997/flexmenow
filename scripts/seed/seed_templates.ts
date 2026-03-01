/**
 * seed_templates.ts
 *
 * Generates 10 sample FlexShot template entries with i18n names, categories,
 * prompts, and aiConfig. Uploads the result to GCS as flexshot_templates.json.
 *
 * Usage:
 *   npx ts-node seed/seed_templates.ts [--dry-run] [--out <path>]
 *
 * Options:
 *   --dry-run   Print JSON to stdout instead of uploading to GCS
 *   --out       Write JSON to a local file path
 */

import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface I18nString {
  en: string;
  vi: string;
  es: string;
  pt: string;
  ja: string;
  ko: string;
}

interface AiConfig {
  model: string;
  negativePrompt: string;
  guidanceScale: number;
  numInferenceSteps: number;
  faceSimilarityDefault: number;
  aspectRatios: string[];
}

interface FlexShotTemplate {
  id: string;
  name: I18nString;
  category: "travel" | "luxury" | "lifestyle" | "art" | "seasonal";
  type: "travel" | "sexy" | "business" | "trend" | "traditional";
  style: string;
  prompt: string;
  previewPrompt: string;
  credits: number;
  premium: boolean;
  badge: string | null;
  rating: number;
  uses: number;
  aiConfig: AiConfig;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Template data
// ---------------------------------------------------------------------------

const templates: FlexShotTemplate[] = [
  {
    id: "tpl_paris_eiffel",
    name: {
      en: "Paris Eiffel",
      vi: "Paris Eiffel",
      es: "Paris Eiffel",
      pt: "Paris Eiffel",
      ja: "パリ エッフェル",
      ko: "파리 에펠",
    },
    category: "travel",
    type: "travel",
    style: "Realistic",
    prompt:
      "Professional portrait of {subject} standing in front of the Eiffel Tower in Paris during golden hour, cinematic lighting, shallow depth of field, 85mm lens, warm tones",
    previewPrompt:
      "Person standing in front of the Eiffel Tower in Paris, golden hour, cinematic",
    credits: 1,
    premium: false,
    badge: "HOT",
    rating: 4.8,
    uses: 12345,
    aiConfig: {
      model: "imagen-3.0-generate-001",
      negativePrompt:
        "blurry, distorted face, extra limbs, bad anatomy, watermark, text",
      guidanceScale: 7.5,
      numInferenceSteps: 50,
      faceSimilarityDefault: 75,
      aspectRatios: ["1:1", "9:16", "16:9"],
    },
    tags: ["paris", "eiffel", "travel", "europe", "golden-hour"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl_lambo_night",
    name: {
      en: "Lamborghini Night",
      vi: "Lamborghini Ban Dem",
      es: "Lamborghini Noche",
      pt: "Lamborghini Noite",
      ja: "ランボルギーニ ナイト",
      ko: "람보르기니 나이트",
    },
    category: "luxury",
    type: "sexy",
    style: "Cinematic",
    prompt:
      "Cinematic portrait of {subject} leaning on a Lamborghini Aventador on a neon-lit city street at night, reflections on wet pavement, moody purple and gold lighting, 35mm lens, ultra-realistic",
    previewPrompt:
      "Person leaning on a Lamborghini at night, neon city street, cinematic",
    credits: 2,
    premium: true,
    badge: "HOT",
    rating: 4.9,
    uses: 9823,
    aiConfig: {
      model: "imagen-3.0-generate-001",
      negativePrompt:
        "blurry, distorted face, extra limbs, bad anatomy, watermark, text, bad car proportions",
      guidanceScale: 8.0,
      numInferenceSteps: 60,
      faceSimilarityDefault: 70,
      aspectRatios: ["1:1", "9:16", "16:9"],
    },
    tags: ["luxury", "car", "lamborghini", "night", "neon", "city"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl_ceo_office",
    name: {
      en: "CEO Office",
      vi: "Van Phong CEO",
      es: "Oficina CEO",
      pt: "Escritorio CEO",
      ja: "CEOオフィス",
      ko: "CEO 오피스",
    },
    category: "lifestyle",
    type: "business",
    style: "Corporate",
    prompt:
      "Professional corporate portrait of {subject} sitting in a modern corner office with floor-to-ceiling windows and city skyline view, wearing a tailored suit, natural window lighting, sharp focus, 50mm lens",
    previewPrompt:
      "Person in a modern corner office with city skyline view, corporate portrait",
    credits: 1,
    premium: false,
    badge: null,
    rating: 4.7,
    uses: 6120,
    aiConfig: {
      model: "imagen-3.0-generate-001",
      negativePrompt:
        "blurry, distorted face, extra limbs, bad anatomy, watermark, text, casual clothing",
      guidanceScale: 7.0,
      numInferenceSteps: 50,
      faceSimilarityDefault: 80,
      aspectRatios: ["1:1", "9:16", "16:9"],
    },
    tags: ["business", "office", "ceo", "corporate", "professional"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl_anime_hero",
    name: {
      en: "Anime Hero",
      vi: "Anh Hung Anime",
      es: "Heroe Anime",
      pt: "Heroi Anime",
      ja: "アニメヒーロー",
      ko: "애니메 히어로",
    },
    category: "art",
    type: "trend",
    style: "Anime",
    prompt:
      "Anime-style portrait of {subject} as a powerful hero with glowing aura, dynamic action pose, vibrant colors, detailed anime shading, manga-inspired background with speed lines, studio quality",
    previewPrompt:
      "Anime hero portrait with glowing aura and dynamic pose, vibrant manga style",
    credits: 1,
    premium: false,
    badge: "NEW",
    rating: 4.8,
    uses: 15200,
    aiConfig: {
      model: "imagen-3.0-generate-001",
      negativePrompt:
        "realistic photo, blurry, low quality, western cartoon style, 3D render",
      guidanceScale: 9.0,
      numInferenceSteps: 50,
      faceSimilarityDefault: 65,
      aspectRatios: ["1:1", "9:16"],
    },
    tags: ["anime", "manga", "hero", "art", "japanese"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl_tokyo_neon",
    name: {
      en: "Tokyo Neon",
      vi: "Tokyo Neon",
      es: "Tokyo Neon",
      pt: "Tokyo Neon",
      ja: "東京ネオン",
      ko: "도쿄 네온",
    },
    category: "travel",
    type: "travel",
    style: "Cinematic",
    prompt:
      "Cinematic street portrait of {subject} walking through neon-lit Tokyo streets at night, Shibuya crossing, rain reflections, cyberpunk atmosphere, Japanese signage, 35mm lens, ultra-detailed",
    previewPrompt:
      "Person walking through neon Tokyo streets at night, rain reflections, cyberpunk",
    credits: 1,
    premium: false,
    badge: null,
    rating: 4.6,
    uses: 8450,
    aiConfig: {
      model: "imagen-3.0-generate-001",
      negativePrompt:
        "blurry, distorted face, extra limbs, bad anatomy, watermark, daytime",
      guidanceScale: 8.0,
      numInferenceSteps: 55,
      faceSimilarityDefault: 75,
      aspectRatios: ["1:1", "9:16", "16:9"],
    },
    tags: ["tokyo", "japan", "neon", "night", "cyberpunk", "travel"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl_yacht_life",
    name: {
      en: "Yacht Life",
      vi: "Du Thuyen Sang Trong",
      es: "Vida en Yate",
      pt: "Vida de Iate",
      ja: "ヨットライフ",
      ko: "요트 라이프",
    },
    category: "luxury",
    type: "sexy",
    style: "Bright",
    prompt:
      "Glamorous portrait of {subject} lounging on a luxury yacht deck in the Mediterranean, crystal clear turquoise water, bright sunny day, designer sunglasses, champagne glass, vivid colors, 85mm lens",
    previewPrompt:
      "Person on a luxury yacht in turquoise Mediterranean waters, sunny day, glamorous",
    credits: 2,
    premium: true,
    badge: null,
    rating: 4.5,
    uses: 4300,
    aiConfig: {
      model: "imagen-3.0-generate-001",
      negativePrompt:
        "blurry, distorted face, extra limbs, bad anatomy, watermark, cloudy, overcast",
      guidanceScale: 7.0,
      numInferenceSteps: 50,
      faceSimilarityDefault: 75,
      aspectRatios: ["1:1", "9:16", "16:9"],
    },
    tags: ["yacht", "luxury", "sea", "mediterranean", "summer"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl_coffee_aesthetic",
    name: {
      en: "Coffee Aesthetic",
      vi: "Tham My Ca Phe",
      es: "Estetica Cafe",
      pt: "Estetica Cafe",
      ja: "コーヒー美学",
      ko: "커피 에스테틱",
    },
    category: "lifestyle",
    type: "trend",
    style: "Warm",
    prompt:
      "Warm-toned portrait of {subject} sitting in a cozy artisan coffee shop, latte art on the table, natural morning light through large windows, bokeh background, earth tones, 50mm lens, lifestyle photography",
    previewPrompt:
      "Person in a cozy artisan coffee shop with latte art, warm morning light",
    credits: 1,
    premium: false,
    badge: null,
    rating: 4.7,
    uses: 7800,
    aiConfig: {
      model: "imagen-3.0-generate-001",
      negativePrompt:
        "blurry, distorted face, extra limbs, bad anatomy, watermark, cold tones, blue",
      guidanceScale: 6.5,
      numInferenceSteps: 45,
      faceSimilarityDefault: 80,
      aspectRatios: ["1:1", "9:16"],
    },
    tags: ["coffee", "aesthetic", "lifestyle", "warm", "cozy"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl_cyberpunk_city",
    name: {
      en: "Cyberpunk City",
      vi: "Thanh Pho Cyberpunk",
      es: "Ciudad Cyberpunk",
      pt: "Cidade Cyberpunk",
      ja: "サイバーパンクシティ",
      ko: "사이버펑크 시티",
    },
    category: "art",
    type: "trend",
    style: "Cyberpunk",
    prompt:
      "Futuristic cyberpunk portrait of {subject} in a neon-drenched dystopian cityscape, holographic billboards, augmented reality HUD overlays, electric blue and magenta lighting, rain, detailed sci-fi environment",
    previewPrompt:
      "Cyberpunk portrait in neon dystopian city with holograms, sci-fi atmosphere",
    credits: 1,
    premium: false,
    badge: "HOT",
    rating: 4.9,
    uses: 18000,
    aiConfig: {
      model: "imagen-3.0-generate-001",
      negativePrompt:
        "blurry, low quality, realistic modern city, daytime, natural lighting",
      guidanceScale: 9.0,
      numInferenceSteps: 60,
      faceSimilarityDefault: 70,
      aspectRatios: ["1:1", "9:16", "16:9"],
    },
    tags: ["cyberpunk", "sci-fi", "neon", "futuristic", "art"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl_bali_sunset",
    name: {
      en: "Bali Sunset",
      vi: "Hoang Hon Bali",
      es: "Atardecer en Bali",
      pt: "Por do Sol em Bali",
      ja: "バリの夕日",
      ko: "발리 선셋",
    },
    category: "travel",
    type: "travel",
    style: "Warm",
    prompt:
      "Stunning portrait of {subject} standing on a Bali clifftop temple at sunset, golden orange sky, silhouetted palm trees, ocean waves below, warm tropical light, 85mm lens, travel photography",
    previewPrompt:
      "Person on a Bali clifftop temple at sunset, golden sky, tropical paradise",
    credits: 1,
    premium: false,
    badge: null,
    rating: 4.7,
    uses: 5600,
    aiConfig: {
      model: "imagen-3.0-generate-001",
      negativePrompt:
        "blurry, distorted face, extra limbs, bad anatomy, watermark, overcast, cold tones",
      guidanceScale: 7.5,
      numInferenceSteps: 50,
      faceSimilarityDefault: 75,
      aspectRatios: ["1:1", "9:16", "16:9"],
    },
    tags: ["bali", "sunset", "travel", "tropical", "temple"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tpl_christmas_joy",
    name: {
      en: "Christmas Joy",
      vi: "Noel Vui Ve",
      es: "Alegria Navidena",
      pt: "Alegria de Natal",
      ja: "クリスマスの喜び",
      ko: "크리스마스 조이",
    },
    category: "seasonal",
    type: "traditional",
    style: "Festive",
    prompt:
      "Festive Christmas portrait of {subject} in a beautifully decorated living room, sparkling Christmas tree with golden ornaments, warm fireplace, cozy sweater, soft bokeh fairy lights, warm holiday atmosphere",
    previewPrompt:
      "Person in a Christmas-decorated living room with tree and fireplace, festive",
    credits: 1,
    premium: false,
    badge: "NEW",
    rating: 4.4,
    uses: 3200,
    aiConfig: {
      model: "imagen-3.0-generate-001",
      negativePrompt:
        "blurry, distorted face, extra limbs, bad anatomy, watermark, summer, outdoor",
      guidanceScale: 7.0,
      numInferenceSteps: 50,
      faceSimilarityDefault: 80,
      aspectRatios: ["1:1", "9:16"],
    },
    tags: ["christmas", "holiday", "festive", "seasonal", "winter"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): { dryRun: boolean; outPath: string | null } {
  const args = process.argv.slice(2);
  let dryRun = false;
  let outPath: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (args[i] === "--out" && args[i + 1]) {
      outPath = args[++i];
    }
  }

  return { dryRun, outPath };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { dryRun, outPath } = parseArgs();
  const jsonData = JSON.stringify(templates, null, 2);

  console.log(`[seed_templates] Generated ${templates.length} FlexShot templates`);

  // Write to local file if --out specified
  if (outPath) {
    const resolvedPath = path.resolve(outPath);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    fs.writeFileSync(resolvedPath, jsonData, "utf-8");
    console.log(`[seed_templates] Written to ${resolvedPath}`);
  }

  // Print to stdout and exit if --dry-run
  if (dryRun) {
    console.log(jsonData);
    return;
  }

  // Upload to GCS
  try {
    // Initialize Firebase Admin (uses GOOGLE_APPLICATION_CREDENTIALS or default)
    if (!admin.apps.length) {
      admin.initializeApp({
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "flexmenow.firebasestorage.app",
      });
    }

    const bucket = admin.storage().bucket();
    const filePath = "config/flexshot_templates.json";
    const file = bucket.file(filePath);

    await file.save(jsonData, {
      contentType: "application/json",
      metadata: {
        cacheControl: "public, max-age=300",
        metadata: {
          generatedBy: "seed_templates",
          generatedAt: new Date().toISOString(),
          templateCount: String(templates.length),
        },
      },
    });

    console.log(`[seed_templates] Uploaded to gs://${bucket.name}/${filePath}`);
    console.log("[seed_templates] Done.");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[seed_templates] Upload failed: ${message}`);
    console.error(
      "[seed_templates] Ensure GOOGLE_APPLICATION_CREDENTIALS is set or Firebase default credentials are available."
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[seed_templates] Fatal error:", err);
  process.exit(1);
});
