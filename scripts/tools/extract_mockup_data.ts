/**
 * extract_mockup_data.ts
 *
 * Reads the mockup app's data arrays (templates, storyPacks, vibes) from
 * docs/mockup_app/src/data/mockData.js and extracts them to structured JSON format
 * suitable for seeding the production database.
 *
 * Usage:
 *   npx ts-node tools/extract_mockup_data.ts [--type all|templates|stories|vibes] [--out <path>]
 *
 * Options:
 *   --type <type>   What to extract: all, templates, stories, vibes (default: all)
 *   --out <path>    Write output to file instead of stdout
 */

import * as fs from "fs";
import * as path from "path";
import * as vm from "vm";

// ---------------------------------------------------------------------------
// Types for extracted data
// ---------------------------------------------------------------------------

interface MockTemplate {
  id: string;
  name: string;
  category: string;
  style: string;
  rating: number;
  uses: number;
  credits: number;
  badge: string | null;
  gp: string;
  premium?: boolean;
}

interface MockScene {
  emoji: string;
  title: string;
  caption: string;
  hashtags: string[];
  time: string;
}

interface MockStoryPack {
  id: string;
  name: string;
  category: string;
  pics: number;
  credits: number;
  rating: number;
  uses: number;
  gp: string;
  desc: string;
  scenes: MockScene[];
}

interface MockVibe {
  id: string;
  name: string;
  color: string | null;
}

interface ExtractedData {
  templates?: TransformedTemplate[];
  stories?: TransformedStory[];
  vibes?: TransformedVibe[];
  extractedAt: string;
  sourceFile: string;
}

// ---------------------------------------------------------------------------
// Transformed output types (production-ready structure)
// ---------------------------------------------------------------------------

interface I18nString {
  en: string;
  vi: string;
  es: string;
  pt: string;
  ja: string;
  ko: string;
}

interface TransformedTemplate {
  id: string;
  name: I18nString;
  category: string;
  style: string;
  rating: number;
  uses: number;
  credits: number;
  badge: string | null;
  premium: boolean;
  prompt: string;
  previewImage: string;
  tags: string[];
}

interface TransformedScene {
  sceneNumber: number;
  title: I18nString;
  caption: I18nString;
  hashtags: string[];
  suggestedPostTime: string;
  aiPrompt: string;
}

interface TransformedStory {
  id: string;
  name: I18nString;
  description: I18nString;
  category: string;
  totalPhotos: number;
  credits: number;
  rating: number;
  uses: number;
  scenes: TransformedScene[];
  tags: string[];
}

interface TransformedVibe {
  id: string;
  name: I18nString;
  color: string | null;
  previewFilter: string;
}

// ---------------------------------------------------------------------------
// Transformation helpers
// ---------------------------------------------------------------------------

function toI18nStub(english: string): I18nString {
  // Creates an i18n object with English filled in and other languages as placeholders
  return {
    en: english,
    vi: `[vi] ${english}`,
    es: `[es] ${english}`,
    pt: `[pt] ${english}`,
    ja: `[ja] ${english}`,
    ko: `[ko] ${english}`,
  };
}

function transformTemplate(mock: MockTemplate): TransformedTemplate {
  return {
    id: `tpl_${mock.id}`,
    name: toI18nStub(mock.name),
    category: mock.category,
    style: mock.style,
    rating: mock.rating,
    uses: mock.uses,
    credits: mock.credits,
    badge: mock.badge,
    premium: mock.premium || false,
    prompt: `Professional portrait of {subject} in a ${mock.name.toLowerCase()} setting, ${mock.style.toLowerCase()} style, high quality`,
    previewImage: `assets/templates/${mock.id}_preview.webp`,
    tags: [mock.category, mock.style.toLowerCase(), mock.name.toLowerCase().replace(/\s+/g, "-")],
  };
}

function transformStory(mock: MockStoryPack): TransformedStory {
  return {
    id: `tale_${mock.id}`,
    name: toI18nStub(mock.name),
    description: toI18nStub(mock.desc),
    category: mock.category,
    totalPhotos: mock.pics,
    credits: mock.credits,
    rating: mock.rating,
    uses: mock.uses,
    scenes: mock.scenes.map((scene, i) => ({
      sceneNumber: i + 1,
      title: toI18nStub(scene.title),
      caption: toI18nStub(scene.caption),
      hashtags: scene.hashtags,
      suggestedPostTime: scene.time,
      aiPrompt: `Portrait of {subject} in scene: ${scene.title}. ${scene.caption}`,
    })),
    tags: [mock.category.toLowerCase(), mock.name.toLowerCase().replace(/\s+/g, "-")],
  };
}

function transformVibe(mock: MockVibe): TransformedVibe {
  return {
    id: mock.id,
    name: toI18nStub(mock.name),
    color: mock.color,
    previewFilter: mock.color
      ? `hue-rotate(${Math.floor(Math.random() * 360)}deg) saturate(1.2)`
      : "none",
  };
}

// ---------------------------------------------------------------------------
// Extract data from mockData.js
// ---------------------------------------------------------------------------

function extractMockData(mockDataPath: string): {
  templates: MockTemplate[];
  storyPacks: MockStoryPack[];
  vibes: MockVibe[];
} {
  if (!fs.existsSync(mockDataPath)) {
    throw new Error(`Mock data file not found: ${mockDataPath}`);
  }

  const source = fs.readFileSync(mockDataPath, "utf-8");

  // Convert ES module exports to CommonJS-compatible code for vm execution
  const transformedSource = source
    .replace(/export\s+const\s+/g, "exports.")
    .replace(/export\s+default\s+/g, "exports.default = ");

  // Create a sandboxed context to evaluate the JS
  const sandbox: Record<string, any> = { exports: {} };
  const context = vm.createContext(sandbox);

  try {
    vm.runInContext(transformedSource, context, {
      filename: "mockData.js",
      timeout: 5000,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to evaluate mockData.js: ${message}`);
  }

  const exports = sandbox.exports;

  return {
    templates: (exports.templates || []) as MockTemplate[],
    storyPacks: (exports.storyPacks || []) as MockStoryPack[],
    vibes: (exports.vibes || []) as MockVibe[],
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

type ExtractType = "all" | "templates" | "stories" | "vibes";

function parseArgs(): { type: ExtractType; outPath: string | null } {
  const args = process.argv.slice(2);
  let type: ExtractType = "all";
  let outPath: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--help" || args[i] === "-h") {
      console.log("Usage: npx ts-node tools/extract_mockup_data.ts [--type all|templates|stories|vibes] [--out <path>]");
      console.log("");
      console.log("Extracts data from the mockup app's mockData.js and transforms it to production JSON format.");
      process.exit(0);
    }
    if (args[i] === "--type" && args[i + 1]) {
      const val = args[++i] as ExtractType;
      if (["all", "templates", "stories", "vibes"].includes(val)) {
        type = val;
      } else {
        console.error(`ERROR: Invalid type "${val}". Must be: all, templates, stories, vibes`);
        process.exit(1);
      }
    }
    if (args[i] === "--out" && args[i + 1]) {
      outPath = args[++i];
    }
  }

  return { type, outPath };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const { type, outPath } = parseArgs();

  // Locate mockData.js relative to project root
  const scriptDir = path.resolve(__dirname, "..");
  const projectRoot = path.resolve(scriptDir, "..");
  const mockDataPath = path.join(projectRoot, "docs", "mockup_app", "src", "data", "mockData.js");

  console.error(`[extract] Source: ${mockDataPath}`);
  console.error(`[extract] Type:   ${type}`);
  console.error("");

  // Extract raw data
  const raw = extractMockData(mockDataPath);

  console.error(`[extract] Found ${raw.templates.length} templates, ${raw.storyPacks.length} story packs, ${raw.vibes.length} vibes`);
  console.error("");

  // Transform to production format
  const result: ExtractedData = {
    extractedAt: new Date().toISOString(),
    sourceFile: mockDataPath,
  };

  if (type === "all" || type === "templates") {
    result.templates = raw.templates.map(transformTemplate);
    console.error(`[extract] Transformed ${result.templates.length} templates`);
  }

  if (type === "all" || type === "stories") {
    result.stories = raw.storyPacks.map(transformStory);
    console.error(`[extract] Transformed ${result.stories.length} stories`);
  }

  if (type === "all" || type === "vibes") {
    result.vibes = raw.vibes.map(transformVibe);
    console.error(`[extract] Transformed ${result.vibes.length} vibes`);
  }

  // Output
  const jsonOutput = JSON.stringify(result, null, 2);

  if (outPath) {
    const resolvedOut = path.resolve(outPath);
    fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });
    fs.writeFileSync(resolvedOut, jsonOutput, "utf-8");
    console.error(`[extract] Written to ${resolvedOut}`);
  } else {
    // Write JSON to stdout (info messages go to stderr)
    process.stdout.write(jsonOutput + "\n");
  }

  console.error("");
  console.error("[extract] Done.");
}

main();
