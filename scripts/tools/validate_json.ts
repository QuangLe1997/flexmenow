/**
 * validate_json.ts
 *
 * Validates a JSON file against FlexShot template or FlexTale story schema using Ajv.
 * Auto-detects schema type based on JSON structure, or accepts explicit --schema flag.
 *
 * Usage:
 *   npx ts-node tools/validate_json.ts <file_path> [--schema flexshot|flextale]
 *
 * Examples:
 *   npx ts-node tools/validate_json.ts ../data/flexshot_templates.json
 *   npx ts-node tools/validate_json.ts ../data/flextale_stories.json --schema flextale
 */

import Ajv, { type JSONSchemaType, type ErrorObject } from "ajv";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// JSON Schema definitions
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

const aiConfigSchema = {
  type: "object" as const,
  properties: {
    model: { type: "string" as const },
    negativePrompt: { type: "string" as const },
    guidanceScale: { type: "number" as const, minimum: 0, maximum: 20 },
    numInferenceSteps: { type: "integer" as const, minimum: 1, maximum: 150 },
    faceSimilarityDefault: { type: "integer" as const, minimum: 0, maximum: 100 },
    aspectRatios: {
      type: "array" as const,
      items: { type: "string" as const, pattern: "^\\d+:\\d+$" },
      minItems: 1,
    },
  },
  required: ["model", "negativePrompt", "guidanceScale", "numInferenceSteps"] as const,
  additionalProperties: false,
};

const flexshotTemplateSchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" as const, minLength: 1 },
    name: i18nStringSchema,
    category: {
      type: "string" as const,
      enum: ["travel", "luxury", "lifestyle", "art", "seasonal"],
    },
    type: {
      type: "string" as const,
      enum: ["travel", "sexy", "business", "trend", "traditional"],
    },
    style: { type: "string" as const },
    prompt: { type: "string" as const, minLength: 10 },
    previewPrompt: { type: "string" as const },
    credits: { type: "integer" as const, minimum: 1, maximum: 10 },
    premium: { type: "boolean" as const },
    badge: {
      anyOf: [{ type: "string" as const }, { type: "null" as const }],
    },
    rating: { type: "number" as const, minimum: 0, maximum: 5 },
    uses: { type: "integer" as const, minimum: 0 },
    aiConfig: aiConfigSchema,
    tags: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    createdAt: { type: "string" as const },
    updatedAt: { type: "string" as const },
  },
  required: ["id", "name", "category", "type", "prompt", "credits", "aiConfig"] as const,
  additionalProperties: false,
};

const flexshotArraySchema = {
  type: "array" as const,
  items: flexshotTemplateSchema,
  minItems: 1,
};

const storySceneSchema = {
  type: "object" as const,
  properties: {
    sceneNumber: { type: "integer" as const, minimum: 1 },
    title: i18nStringSchema,
    caption: i18nStringSchema,
    hashtags: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    suggestedPostTime: { type: "string" as const },
    aiPrompt: { type: "string" as const, minLength: 10 },
  },
  required: ["sceneNumber", "title", "caption", "aiPrompt"] as const,
  additionalProperties: false,
};

const storyChapterSchema = {
  type: "object" as const,
  properties: {
    chapterNumber: { type: "integer" as const, minimum: 1 },
    title: i18nStringSchema,
    scenes: {
      type: "array" as const,
      items: storySceneSchema,
      minItems: 1,
    },
  },
  required: ["chapterNumber", "title", "scenes"] as const,
  additionalProperties: false,
};

const flextaleStorySchema = {
  type: "object" as const,
  properties: {
    id: { type: "string" as const, minLength: 1 },
    name: i18nStringSchema,
    description: i18nStringSchema,
    category: { type: "string" as const },
    totalPhotos: { type: "integer" as const, minimum: 1 },
    credits: { type: "integer" as const, minimum: 1 },
    rating: { type: "number" as const, minimum: 0, maximum: 5 },
    uses: { type: "integer" as const, minimum: 0 },
    style: { type: "string" as const },
    chapters: {
      type: "array" as const,
      items: storyChapterSchema,
      minItems: 1,
    },
    tags: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    premium: { type: "boolean" as const },
    badge: {
      anyOf: [{ type: "string" as const }, { type: "null" as const }],
    },
    createdAt: { type: "string" as const },
    updatedAt: { type: "string" as const },
  },
  required: ["id", "name", "description", "category", "credits", "chapters"] as const,
  additionalProperties: false,
};

const flextaleArraySchema = {
  type: "array" as const,
  items: flextaleStorySchema,
  minItems: 1,
};

// ---------------------------------------------------------------------------
// Schema detection
// ---------------------------------------------------------------------------

type SchemaType = "flexshot" | "flextale";

function detectSchemaType(data: unknown): SchemaType | null {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const first = data[0];
  if (typeof first !== "object" || first === null) {
    return null;
  }

  // FlexTale stories have "chapters" array
  if ("chapters" in first) {
    return "flextale";
  }

  // FlexShot templates have "aiConfig" and "prompt"
  if ("aiConfig" in first || "prompt" in first) {
    return "flexshot";
  }

  return null;
}

// ---------------------------------------------------------------------------
// Error formatting
// ---------------------------------------------------------------------------

function formatErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) {
    return "No errors";
  }

  return errors
    .map((err, i) => {
      const path = err.instancePath || "/";
      const msg = err.message || "unknown error";
      const params = JSON.stringify(err.params);
      return `  ${i + 1}. ${path}: ${msg} (${params})`;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(): { filePath: string; schema: SchemaType | null } {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log("Usage: npx ts-node tools/validate_json.ts <file_path> [--schema flexshot|flextale]");
    console.log("");
    console.log("Validates a JSON file against FlexShot or FlexTale schema.");
    console.log("Schema type is auto-detected unless --schema is specified.");
    process.exit(0);
  }

  let filePath = args[0];
  let schema: SchemaType | null = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--schema" && args[i + 1]) {
      const val = args[++i];
      if (val === "flexshot" || val === "flextale") {
        schema = val;
      } else {
        console.error(`ERROR: Invalid schema type "${val}". Must be "flexshot" or "flextale".`);
        process.exit(1);
      }
    }
  }

  return { filePath, schema };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const { filePath, schema: explicitSchema } = parseArgs();
  const resolvedPath = path.resolve(filePath);

  // Check file exists
  if (!fs.existsSync(resolvedPath)) {
    console.error(`ERROR: File not found: ${resolvedPath}`);
    process.exit(1);
  }

  // Read and parse JSON
  let data: unknown;
  try {
    const raw = fs.readFileSync(resolvedPath, "utf-8");
    data = JSON.parse(raw);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`ERROR: Failed to parse JSON: ${message}`);
    process.exit(1);
  }

  // Determine schema type
  const schemaType = explicitSchema || detectSchemaType(data);

  if (!schemaType) {
    console.error("ERROR: Could not auto-detect schema type. Use --schema flexshot|flextale.");
    process.exit(1);
  }

  console.log(`[validate] File:   ${resolvedPath}`);
  console.log(`[validate] Schema: ${schemaType}`);
  console.log("");

  // Select schema
  const jsonSchema = schemaType === "flexshot" ? flexshotArraySchema : flextaleArraySchema;

  // Validate
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(jsonSchema);
  const valid = validate(data);

  if (valid) {
    const count = Array.isArray(data) ? data.length : 1;
    console.log(`VALID: ${count} ${schemaType} item(s) passed validation.`);
    console.log("");

    // Print summary
    if (Array.isArray(data)) {
      data.forEach((item: any, i: number) => {
        const name = typeof item.name === "object" ? item.name.en : item.name;
        console.log(`  ${i + 1}. ${item.id} - ${name}`);
      });
    }

    process.exit(0);
  } else {
    const errorCount = validate.errors?.length || 0;
    console.error(`INVALID: ${errorCount} validation error(s) found.\n`);
    console.error(formatErrors(validate.errors));
    console.error("");

    // Show first few items for context
    if (Array.isArray(data) && data.length > 0) {
      console.error("First item keys:", Object.keys(data[0]).join(", "));
    }

    process.exit(1);
  }
}

main();
