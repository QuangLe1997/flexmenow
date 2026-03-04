/**
 * validate_json.ts
 *
 * Validates FlexShot templates, FlexTale stories, and Onboarding JSON files
 * against their full schemas (TECHNICAL_REQUIREMENTS.md).
 *
 * Usage:
 *   npx ts-node tools/validate_json.ts <file_path> [--schema flexshot|flextale|onboarding]
 *   npx ts-node tools/validate_json.ts --all   (validates all known files in public/config/)
 *
 * Examples:
 *   npx ts-node tools/validate_json.ts ../public/config/flexshot_templates.json
 *   npx ts-node tools/validate_json.ts --all
 */

import Ajv, { type ErrorObject } from "ajv";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Schema definitions — matching TECHNICAL_REQUIREMENTS.md
// ---------------------------------------------------------------------------

const i18nStringSchema = {
  type: "object" as const,
  properties: {
    en: { type: "string" as const },
    vi: { type: "string" as const },
    es: { type: "string" as const },
    pt: { type: "string" as const },
    ja: { type: "string" as const },
    ko: { type: "string" as const },
  },
  required: ["en"] as const,
  additionalProperties: false,
};

const i18nStringListSchema = {
  type: "object" as const,
  properties: {
    en: { type: "array" as const, items: { type: "string" as const } },
    vi: { type: "array" as const, items: { type: "string" as const } },
    es: { type: "array" as const, items: { type: "string" as const } },
    pt: { type: "array" as const, items: { type: "string" as const } },
    ja: { type: "array" as const, items: { type: "string" as const } },
    ko: { type: "array" as const, items: { type: "string" as const } },
  },
  required: ["en"] as const,
  additionalProperties: false,
};

const categoryItemSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" as const },
    name: i18nStringSchema,
    icon: { type: "string" as const },
    sortOrder: { type: "integer" as const },
  },
  required: ["id", "name", "sortOrder"] as const,
};

const typeItemSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" as const },
    name: i18nStringSchema,
  },
  required: ["id", "name"] as const,
};

const genderItemSchema = typeItemSchema;

// ---- FlexShot Template Schema ----

const templatePromptSchema = {
  type: "object" as const,
  properties: {
    base: { type: "string" as const, minLength: 10 },
    negative: { type: "string" as const },
    styleHint: { type: "string" as const },
  },
  required: ["base", "negative"] as const,
};

const templateAiConfigSchema = {
  type: "object" as const,
  properties: {
    model: { type: "string" as const },
    guidanceScale: { type: "number" as const },
    aspectRatio: { type: "string" as const },
    numberOfImages: { type: "integer" as const },
    safetyFilterLevel: { type: "string" as const },
    referenceType: { type: "string" as const },
    seed: {},
  },
  required: ["model", "guidanceScale", "aspectRatio"] as const,
};

const templateStatsSchema = {
  type: "object" as const,
  properties: {
    likes: { type: "integer" as const },
    views: { type: "integer" as const },
    generates: { type: "integer" as const },
  },
  required: ["likes", "views", "generates"] as const,
};

const templateItemSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" as const, minLength: 1 },
    name: i18nStringSchema,
    category: { type: "string" as const, enum: ["travel", "luxury", "lifestyle", "art", "seasonal"] },
    type: { type: "string" as const, enum: ["travel", "sexy", "business", "trend", "traditional"] },
    gender: { type: "string" as const, enum: ["male", "female", "couple", "all"] },
    style: { type: "string" as const },
    credits: { type: "integer" as const, minimum: 1 },
    badge: { anyOf: [{ type: "string" as const }, { type: "null" as const }] },
    premium: { type: "boolean" as const },
    isActive: { type: "boolean" as const },
    sortOrder: { type: "integer" as const },
    coverImage: { type: "string" as const },
    previewImages: { type: "array" as const, items: { type: "string" as const } },
    prompt: templatePromptSchema,
    aiConfig: templateAiConfigSchema,
    stats: templateStatsSchema,
    tags: { type: "array" as const, items: { type: "string" as const } },
    createdAt: { type: "string" as const },
    updatedAt: { type: "string" as const },
  },
  required: ["id", "name", "category", "type", "gender", "credits", "prompt", "aiConfig", "isActive", "sortOrder"] as const,
};

const flexshotSchema = {
  type: "object" as const,
  properties: {
    version: { type: "string" as const },
    updatedAt: { type: "string" as const },
    defaults: {
      type: "object" as const,
      properties: {
        creditsPerTemplate: { type: "integer" as const },
        premiumCreditsPerTemplate: { type: "integer" as const },
      },
      required: ["creditsPerTemplate", "premiumCreditsPerTemplate"] as const,
    },
    categories: { type: "array" as const, items: categoryItemSchema, minItems: 1 },
    types: { type: "array" as const, items: typeItemSchema, minItems: 1 },
    genders: { type: "array" as const, items: genderItemSchema, minItems: 1 },
    templates: { type: "array" as const, items: templateItemSchema, minItems: 1 },
  },
  required: ["version", "defaults", "categories", "types", "genders", "templates"] as const,
};

// ---- FlexTale Story Schema ----

const chapterPromptSchema = {
  type: "object" as const,
  properties: {
    base: { type: "string" as const, minLength: 10 },
    negative: { type: "string" as const },
    styleHint: { type: "string" as const },
  },
  required: ["base", "negative"] as const,
};

const chapterAiConfigSchema = {
  type: "object" as const,
  properties: {
    model: { type: "string" as const },
    guidanceScale: { type: "number" as const },
    aspectRatio: { type: "string" as const },
    referenceType: { type: "string" as const },
  },
  required: ["model", "guidanceScale", "aspectRatio"] as const,
};

const chapterSchema = {
  type: "object" as const,
  properties: {
    order: { type: "integer" as const, minimum: 1 },
    heading: i18nStringSchema,
    text: i18nStringSchema,
    choices: i18nStringListSchema,
    prompt: chapterPromptSchema,
    aiConfig: chapterAiConfigSchema,
  },
  required: ["order", "heading", "text", "choices", "prompt", "aiConfig"] as const,
};

const storyStatsSchema = {
  type: "object" as const,
  properties: {
    likes: { type: "integer" as const },
    views: { type: "integer" as const },
    generates: { type: "integer" as const },
  },
  required: ["likes", "views", "generates"] as const,
};

const storyItemSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" as const, minLength: 1 },
    title: i18nStringSchema,
    description: i18nStringSchema,
    category: { type: "string" as const },
    type: { type: "string" as const },
    gender: { type: "string" as const },
    duration: { type: "string" as const, enum: ["moment", "once", "many"] },
    totalPics: { type: "integer" as const, minimum: 1 },
    credits: { type: "integer" as const, minimum: 1 },
    badge: { anyOf: [{ type: "string" as const }, { type: "null" as const }] },
    premium: { type: "boolean" as const },
    isActive: { type: "boolean" as const },
    sortOrder: { type: "integer" as const },
    coverImage: { type: "string" as const },
    previewImages: { type: "array" as const, items: { type: "string" as const } },
    chapters: { type: "array" as const, items: chapterSchema, minItems: 1 },
    tags: { type: "array" as const, items: { type: "string" as const } },
    stats: storyStatsSchema,
    createdAt: { type: "string" as const },
    updatedAt: { type: "string" as const },
  },
  required: ["id", "title", "description", "category", "duration", "totalPics", "credits", "chapters", "isActive", "sortOrder"] as const,
};

const durationItemSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" as const },
    name: i18nStringSchema,
    icon: { type: "string" as const },
  },
  required: ["id", "name", "icon"] as const,
};

const flextaleSchema = {
  type: "object" as const,
  properties: {
    version: { type: "string" as const },
    updatedAt: { type: "string" as const },
    categories: { type: "array" as const, items: categoryItemSchema, minItems: 1 },
    types: { type: "array" as const, items: typeItemSchema },
    genders: { type: "array" as const, items: genderItemSchema },
    durations: { type: "array" as const, items: durationItemSchema, minItems: 1 },
    stories: { type: "array" as const, items: storyItemSchema, minItems: 1 },
  },
  required: ["version", "categories", "durations", "stories"] as const,
};

// ---- Onboarding Schema ----

const onboardingSlideSchema = {
  type: "object" as const,
  properties: {
    badge: { type: "string" as const },
    icon: { type: "string" as const },
    title: i18nStringSchema,
    slogan: i18nStringSchema,
    subtitle: i18nStringSchema,
    accentColor: { type: "string" as const },
    images: { type: "array" as const, items: { type: "string" as const } },
    animation: { type: "string" as const },
  },
  required: ["badge", "icon", "title", "slogan", "subtitle", "accentColor", "images"] as const,
};

const personalizeOptionSchema = {
  type: "object" as const,
  properties: {
    label: i18nStringSchema,
    tabTarget: { type: "string" as const },
    accentColor: { type: "string" as const },
  },
  required: ["label", "tabTarget", "accentColor"] as const,
};

const loginConfigSchema = {
  type: "object" as const,
  properties: {
    freeCreditsLabel: i18nStringSchema,
    showGoogle: { type: "boolean" as const },
    showApple: { type: "boolean" as const },
    showAnonymous: { type: "boolean" as const },
  },
  required: ["freeCreditsLabel", "showGoogle", "showApple", "showAnonymous"] as const,
};

const onboardingSchema = {
  type: "object" as const,
  properties: {
    version: { type: "string" as const },
    region: { type: "string" as const },
    slides: { type: "array" as const, items: onboardingSlideSchema, minItems: 1 },
    personalizeOptions: { type: "array" as const, items: personalizeOptionSchema },
    loginConfig: loginConfigSchema,
  },
  required: ["version", "region", "slides", "personalizeOptions", "loginConfig"] as const,
};

// ---------------------------------------------------------------------------
// Schema detection
// ---------------------------------------------------------------------------

type SchemaType = "flexshot" | "flextale" | "onboarding";

function detectSchemaType(data: unknown): SchemaType | null {
  if (typeof data !== "object" || data === null) return null;
  const obj = data as Record<string, unknown>;

  if ("templates" in obj) return "flexshot";
  if ("stories" in obj) return "flextale";
  if ("slides" in obj) return "onboarding";

  return null;
}

function getSchema(schemaType: SchemaType) {
  switch (schemaType) {
    case "flexshot": return flexshotSchema;
    case "flextale": return flextaleSchema;
    case "onboarding": return onboardingSchema;
  }
}

// ---------------------------------------------------------------------------
// Error formatting
// ---------------------------------------------------------------------------

function formatErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) return "No errors";
  return errors
    .map((err, i) => {
      const p = err.instancePath || "/";
      return `  ${i + 1}. ${p}: ${err.message} (${JSON.stringify(err.params)})`;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Validate single file
// ---------------------------------------------------------------------------

function validateFile(filePath: string, explicitSchema: SchemaType | null): boolean {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`ERROR: File not found: ${resolvedPath}`);
    return false;
  }

  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
  } catch (err: unknown) {
    console.error(`ERROR: Failed to parse JSON: ${err instanceof Error ? err.message : err}`);
    return false;
  }

  const schemaType = explicitSchema || detectSchemaType(data);
  if (!schemaType) {
    console.error(`ERROR: Could not detect schema for ${resolvedPath}. Use --schema.`);
    return false;
  }

  console.log(`[validate] File:   ${resolvedPath}`);
  console.log(`[validate] Schema: ${schemaType}`);

  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(getSchema(schemaType));
  const valid = validate(data);

  if (valid) {
    const d = data as Record<string, unknown>;
    let count = 0;
    if (schemaType === "flexshot" && Array.isArray(d.templates)) count = d.templates.length;
    if (schemaType === "flextale" && Array.isArray(d.stories)) count = d.stories.length;
    if (schemaType === "onboarding" && Array.isArray(d.slides)) count = d.slides.length;
    console.log(`  PASS: ${count} item(s) validated.\n`);
    return true;
  } else {
    console.error(`  FAIL: ${validate.errors?.length || 0} error(s)\n`);
    console.error(formatErrors(validate.errors));
    console.error("");
    return false;
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log("Usage: npx ts-node tools/validate_json.ts <file_path> [--schema flexshot|flextale|onboarding]");
    console.log("       npx ts-node tools/validate_json.ts --all");
    process.exit(0);
  }

  // --all mode: validate all known files
  if (args[0] === "--all") {
    const configDir = path.resolve(__dirname, "../../public/config");
    const files = [
      "flexshot_templates.json",
      "flextale_stories.json",
      "onboarding_VN.json",
      "onboarding_US.json",
      "onboarding_JP.json",
    ];

    let allPassed = true;
    for (const file of files) {
      const fp = path.join(configDir, file);
      if (fs.existsSync(fp)) {
        if (!validateFile(fp, null)) allPassed = false;
      } else {
        console.log(`[validate] SKIP: ${file} (not found)`);
      }
    }

    console.log(allPassed ? "\nAll validations passed." : "\nSome validations FAILED.");
    process.exit(allPassed ? 0 : 1);
  }

  // Single file mode
  let explicitSchema: SchemaType | null = null;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--schema" && args[i + 1]) {
      const val = args[++i];
      if (val === "flexshot" || val === "flextale" || val === "onboarding") {
        explicitSchema = val;
      } else {
        console.error(`ERROR: Invalid schema "${val}". Must be flexshot|flextale|onboarding.`);
        process.exit(1);
      }
    }
  }

  const ok = validateFile(args[0], explicitSchema);
  process.exit(ok ? 0 : 1);
}

main();
