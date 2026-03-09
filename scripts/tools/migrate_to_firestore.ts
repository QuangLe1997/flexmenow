/**
 * Migrate local JSON files to Firestore CMS collections via REST API.
 * Uses gcloud/firebase CLI access token for auth.
 *
 * Collections created:
 *   cms_templates/{id}  — full TemplateItem docs
 *   cms_stories/{id}    — full StoryItem docs
 *   cms_meta/templates  — metadata
 *   cms_meta/stories    — metadata
 *
 * Also syncs to CF collections:
 *   templates/{id}      — simplified for Cloud Functions
 *   storyPacks/{id}     — simplified for Cloud Functions
 *   storyPacks/{id}/scenes/scene_{n}
 *
 * Usage: npx tsx scripts/tools/migrate_to_firestore.ts
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const PROJECT_ID = "flexme-now";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function getAccessToken(): string {
  // Try firebase CLI token first, then gcloud
  try {
    const homedir = process.env.HOME || process.env.USERPROFILE || "";
    const cfgPath = path.join(homedir, ".config", "configstore", "firebase-tools.json");
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
      const refreshToken = cfg.tokens?.refresh_token;
      if (refreshToken) {
        const result = execSync(
          `curl -s -X POST https://oauth2.googleapis.com/token -d "grant_type=refresh_token&refresh_token=${refreshToken}&client_id=563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com&client_secret=j9iVZfS8kkCEFUPaAeJV0sAi"`,
          { encoding: "utf8" }
        );
        const parsed = JSON.parse(result);
        if (parsed.access_token) return parsed.access_token;
      }
    }
  } catch {}

  return execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val)
      ? { integerValue: String(val) }
      : { doubleValue: val };
  }
  if (typeof val === "boolean") return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFirestoreDoc(data: Record<string, any>): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, any>;
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = toFirestoreValue(v);
  }
  return { fields };
}

async function patchDocument(
  token: string,
  collection: string,
  docId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
): Promise<void> {
  const url = `${BASE_URL}/${collection}/${docId}`;
  const body = toFirestoreDoc(data);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PATCH ${collection}/${docId} failed (${response.status}): ${text.slice(0, 200)}`);
  }
}

async function patchSubDocument(
  token: string,
  parentCollection: string,
  parentId: string,
  subCollection: string,
  docId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
): Promise<void> {
  const url = `${BASE_URL}/${parentCollection}/${parentId}/${subCollection}/${docId}`;
  const body = toFirestoreDoc(data);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `PATCH ${parentCollection}/${parentId}/${subCollection}/${docId} failed (${response.status}): ${text.slice(0, 200)}`
    );
  }
}

async function main() {
  console.log("=== FlexMe CMS → Firestore Migration (REST API) ===\n");

  const token = getAccessToken();
  console.log("Got access token\n");

  const templatesPath = path.resolve(
    __dirname,
    "../../public/config/flexshot_templates.json"
  );
  const storiesPath = path.resolve(
    __dirname,
    "../../public/config/flextale_stories.json"
  );

  // ── Templates ──
  if (fs.existsSync(templatesPath)) {
    const json = JSON.parse(fs.readFileSync(templatesPath, "utf-8"));
    console.log(`=== Templates: ${json.templates.length} items (v${json.version}) ===`);

    // Save metadata
    await patchDocument(token, "cms_meta", "templates", {
      version: json.version,
      updatedAt: json.updatedAt || new Date().toISOString(),
      imageBaseUrl: json.imageBaseUrl || "",
      imageSuffix: json.imageSuffix || ".webp",
      defaults: json.defaults || {},
      categories: json.categories || [],
      types: json.types || [],
      genders: json.genders || [],
    });
    console.log("  Saved cms_meta/templates");

    // Import each template to cms_templates
    let count = 0;
    for (const t of json.templates) {
      await patchDocument(token, "cms_templates", t.id, t);
      count++;
      if (count % 50 === 0) {
        console.log(`  cms_templates: ${count}/${json.templates.length}`);
      }
    }
    console.log(`  cms_templates: ${count} imported`);

    // Sync active templates to CF templates collection
    let cfCount = 0;
    for (const t of json.templates) {
      if (!t.isActive) continue;
      await patchDocument(token, "templates", t.id, {
        name: t.name?.en || t.slug || t.id,
        isActive: t.isActive,
        isPremium: t.premium ?? false,
        promptTemplate: t.prompt?.base || "",
        style: t.style || "",
        category: t.category || "",
        negativePrompt: t.prompt?.negative || "",
        imagenParams: {
          aspectRatio: t.aiConfig?.aspectRatios?.[0] || "1:1",
          guidanceScale: t.aiConfig?.guidanceScale ?? 7.5,
        },
        usageCount: 0,
        credits: t.credits ?? 1,
        slug: t.slug || "",
        tags: t.tags || [],
        coverImage: t.coverImage || "",
        gender: t.gender || "all",
        updatedAt: new Date().toISOString(),
      });
      cfCount++;
      if (cfCount % 50 === 0) {
        console.log(`  CF templates: ${cfCount}`);
      }
    }
    console.log(`  CF templates: ${cfCount} synced`);
  } else {
    console.warn(`Templates file not found: ${templatesPath}`);
  }

  // ── Stories ──
  if (fs.existsSync(storiesPath)) {
    const json = JSON.parse(fs.readFileSync(storiesPath, "utf-8"));
    console.log(`\n=== Stories: ${json.stories.length} items (v${json.version}) ===`);

    // Save metadata
    await patchDocument(token, "cms_meta", "stories", {
      version: json.version,
      updatedAt: json.updatedAt || new Date().toISOString(),
      imageBaseUrl: json.imageBaseUrl || "",
      imageSuffix: json.imageSuffix || ".webp",
      categories: json.categories || [],
      types: json.types || [],
      genders: json.genders || [],
      durations: json.durations || [],
    });
    console.log("  Saved cms_meta/stories");

    // Import each story to cms_stories
    let count = 0;
    for (const s of json.stories) {
      await patchDocument(token, "cms_stories", s.id, s);
      count++;
      if (count % 50 === 0) {
        console.log(`  cms_stories: ${count}/${json.stories.length}`);
      }
    }
    console.log(`  cms_stories: ${count} imported`);

    // Sync active stories to CF storyPacks
    let cfCount = 0;
    for (const s of json.stories) {
      if (!s.isActive) continue;

      await patchDocument(token, "storyPacks", s.id, {
        name: s.title?.en || s.slug || s.id,
        description: s.description?.en || "",
        category: s.category || "adventure",
        previewUrls: s.previewImages || [],
        totalScenes: s.chapters?.length || 0,
        creditsCost: s.credits ?? 5,
        isPremium: s.premium ?? false,
        isActive: s.isActive,
        sortOrder: s.sortOrder ?? 0,
        coverImage: s.coverImage || "",
        slug: s.slug || "",
        tags: s.tags || [],
        gender: s.gender || "all",
        updatedAt: new Date().toISOString(),
      });

      // Write scenes subcollection
      if (s.chapters?.length) {
        for (let i = 0; i < s.chapters.length; i++) {
          const ch = s.chapters[i];
          await patchSubDocument(
            token,
            "storyPacks",
            s.id,
            "scenes",
            `scene_${i + 1}`,
            {
              sceneOrder: ch.order ?? i + 1,
              sceneName: ch.heading?.en || `Scene ${i + 1}`,
              promptTemplate: ch.prompt?.base || "",
              negativePrompt: ch.prompt?.negative || "",
              styleHint: ch.prompt?.styleHint || "",
              imagenParams: {
                guidanceScale: ch.aiConfig?.guidanceScale ?? 7.5,
                aspectRatio: ch.aiConfig?.aspectRatio || "9:16",
              },
            }
          );
        }
      }

      cfCount++;
      if (cfCount % 50 === 0) {
        console.log(`  CF storyPacks: ${cfCount}`);
      }
    }
    console.log(`  CF storyPacks: ${cfCount} synced (with scenes)`);
  } else {
    console.warn(`Stories file not found: ${storiesPath}`);
  }

  console.log("\n=== Migration Complete ===");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
