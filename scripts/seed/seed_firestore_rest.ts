/**
 * Seed Firestore via REST API using gcloud access token.
 * This avoids needing GOOGLE_APPLICATION_CREDENTIALS.
 *
 * Usage:
 *   npx ts-node seed/seed_firestore_rest.ts
 *   npx ts-node seed/seed_firestore_rest.ts --dry-run
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const DRY_RUN = process.argv.includes("--dry-run");
const PROJECT_ID = "flexme-now";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function getAccessToken(): string {
  const token = execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim();
  return token;
}

// Convert a JS value to Firestore REST value format
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === "boolean") return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === "object") {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreDoc(data: Record<string, any>): { fields: Record<string, any> } {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === "_serverTimestamp") continue;
    fields[k] = toFirestoreValue(v);
  }
  return { fields };
}

async function patchDocument(
  token: string,
  collection: string,
  docId: string,
  data: Record<string, any>
): Promise<void> {
  const url = `${BASE_URL}/${collection}/${docId}`;
  const body = toFirestoreDoc(data);

  const resp = await fetch(url, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`PATCH ${collection}/${docId} failed: ${resp.status} ${errText}`);
  }
}

// ──────────────────────────────────────────────
// Seed FlexShot templates
// ──────────────────────────────────────────────
async function seedTemplates(token: string) {
  const jsonPath = path.resolve(__dirname, "../../public/config/flexshot_templates.json");
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const templates: any[] = data.templates;

  console.log(`[templates] Found ${templates.length} templates`);

  for (const t of templates) {
    const doc: Record<string, any> = {
      name: typeof t.name === "object" ? t.name.en : t.name,
      nameI18n: t.name,
      category: t.category,
      type: t.type,
      gender: t.gender,
      style: t.style,
      credits: t.credits,
      badge: t.badge || null,
      isPremium: t.premium === true,
      isActive: t.isActive !== false,
      sortOrder: t.sortOrder || 0,
      coverImage: t.coverImage || null,
      previewImages: t.previewImages || [],
      promptTemplate: t.prompt?.base || "",
      negativePrompt: t.prompt?.negative || "",
      styleHint: t.prompt?.styleHint || "",
      imagenParams: {
        guidanceScale: t.aiConfig?.guidanceScale || 7.5,
        aspectRatio: t.aiConfig?.aspectRatio || "1:1",
        safetyFilterLevel: t.aiConfig?.safetyFilterLevel || "BLOCK_MEDIUM_AND_ABOVE",
        numberOfImages: t.aiConfig?.numberOfImages || 1,
        model: t.aiConfig?.model || "imagen-3.0-generate-001",
        referenceType: t.aiConfig?.referenceType || "SUBJECT_REFERENCE",
      },
      stats: t.stats || { likes: 0, views: 0, generates: 0 },
      tags: t.tags || [],
    };

    if (DRY_RUN) {
      console.log(`  [dry-run] templates/${t.id}`);
    } else {
      await patchDocument(token, "templates", t.id, doc);
      console.log(`  + templates/${t.id} — ${doc.name}`);
    }
  }

  console.log(`[templates] ${DRY_RUN ? "Would seed" : "Seeded"} ${templates.length} templates`);
}

// ──────────────────────────────────────────────
// Seed FlexTale story packs + scenes
// ──────────────────────────────────────────────
async function seedStoryPacks(token: string) {
  const jsonPath = path.resolve(__dirname, "../../public/config/flextale_stories.json");
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const stories: any[] = data.stories;

  console.log(`[storyPacks] Found ${stories.length} story packs`);

  for (const story of stories) {
    const chapters: any[] = story.chapters || [];

    const packDoc: Record<string, any> = {
      name: typeof story.title === "object" ? story.title.en : (story.title || story.name),
      nameI18n: story.title || story.name,
      description: typeof story.description === "object" ? story.description.en : story.description,
      descriptionI18n: story.description,
      category: (story.category || "travel").toLowerCase(),
      type: story.type,
      gender: story.gender,
      totalScenes: chapters.length,
      creditsCost: story.credits || (5 + chapters.length),
      isPremium: story.premium === true,
      isActive: story.isActive !== false,
      sortOrder: story.sortOrder || 0,
      coverImage: story.coverImage || null,
      previewUrls: story.previewImages || [],
      badge: story.badge || null,
      usageCount: story.uses || 0,
      tags: story.tags || [],
    };

    if (DRY_RUN) {
      console.log(`  [dry-run] storyPacks/${story.id} — ${chapters.length} scenes`);
    } else {
      await patchDocument(token, "storyPacks", story.id, packDoc);
      console.log(`  + storyPacks/${story.id} — ${packDoc.name}`);

      // Seed scenes subcollection
      for (const ch of chapters) {
        const sceneDoc: Record<string, any> = {
          sceneOrder: ch.order,
          sceneName: typeof ch.heading === "object" ? ch.heading.en : ch.heading,
          sceneNameI18n: ch.heading,
          promptTemplate: ch.prompt?.base || "",
          negativePrompt: ch.prompt?.negative || "",
          styleHint: ch.prompt?.styleHint || "",
          imagenParams: {
            guidanceScale: ch.aiConfig?.guidanceScale || 8.0,
            aspectRatio: ch.aiConfig?.aspectRatio || "3:4",
          },
        };
        const sceneId = `scene_${ch.order}`;
        await patchDocument(token, `storyPacks/${story.id}/scenes`, sceneId, sceneDoc);
        process.stdout.write(`    + scene_${ch.order} `);
      }
      console.log();
    }
  }

  console.log(`[storyPacks] ${DRY_RUN ? "Would seed" : "Seeded"} ${stories.length} story packs`);
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
async function main() {
  console.log(`\nSeeding Firestore (project: ${PROJECT_ID})${DRY_RUN ? " [DRY RUN]" : ""}\n`);

  const token = getAccessToken();
  console.log(`Got access token (${token.substring(0, 20)}...)\n`);

  await seedTemplates(token);
  console.log();
  await seedStoryPacks(token);

  console.log("\nDone!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err.message || err);
  process.exit(1);
});
