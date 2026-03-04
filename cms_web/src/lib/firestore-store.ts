/**
 * Firestore-based data store for CMS (source of truth).
 *
 * Collections:
 *   cms_templates/{id}   — full TemplateItem docs
 *   cms_stories/{id}     — full StoryItem docs
 *   cms_meta/templates   — metadata (version, imageBaseUrl, categories, etc.)
 *   cms_meta/stories     — metadata (version, imageBaseUrl, categories, etc.)
 *
 * On publish, data is exported to:
 *   1. GCS JSON (for mobile app via Remote Config)
 *   2. CF Firestore collections: `templates` and `storyPacks` + scenes subcollection
 */

import { db } from "./firebase-admin";
import { uploadToGcs, downloadFromGcs } from "./gcs";
import type {
  TemplateItem,
  TemplatesJson,
  StoryItem,
  StoriesJson,
  ContentType,
  VersionManifest,
  VersionInfo,
} from "./types";

// ── Firestore collection names ──

const CMS_TEMPLATES = "cms_templates";
const CMS_STORIES = "cms_stories";
const CMS_META = "cms_meta";

// CF collection names (for sync on publish)
const CF_TEMPLATES = "templates";
const CF_STORY_PACKS = "storyPacks";

// GCS canonical paths
const GCS_TEMPLATES_PATH = "config/flexshot_templates.json";
const GCS_STORIES_PATH = "config/flextale_stories.json";

// ── Metadata defaults ──

const DEFAULT_TEMPLATES_META = {
  version: "1.0.0",
  updatedAt: new Date().toISOString(),
  imageBaseUrl: "https://storage.googleapis.com/flexme-now.firebasestorage.app/",
  imageSuffix: ".webp",
  defaults: {
    creditsPerTemplate: 1,
    premiumCreditsPerTemplate: 2,
  },
  categories: [] as { id: string; name: { en: string } }[],
  types: [] as { id: string; name: { en: string } }[],
  genders: [] as { id: string; name: { en: string } }[],
};

const DEFAULT_STORIES_META = {
  version: "1.0.0",
  updatedAt: new Date().toISOString(),
  imageBaseUrl: "https://storage.googleapis.com/flexme-now.firebasestorage.app/",
  imageSuffix: ".webp",
  categories: [] as { id: string; name: { en: string } }[],
  types: [] as { id: string; name: { en: string } }[],
  genders: [] as { id: string; name: { en: string } }[],
  durations: [] as { id: string; name: { en: string } }[],
};

// ── Templates CRUD ──

export async function getTemplatesMeta(): Promise<Record<string, unknown>> {
  const doc = await db.collection(CMS_META).doc("templates").get();
  if (!doc.exists) return { ...DEFAULT_TEMPLATES_META };
  return doc.data() as Record<string, unknown>;
}

export async function saveTemplatesMeta(
  meta: Record<string, unknown>
): Promise<void> {
  meta.updatedAt = new Date().toISOString();
  await db.collection(CMS_META).doc("templates").set(meta, { merge: true });
}

export async function getAllTemplates(): Promise<TemplateItem[]> {
  const snap = await db
    .collection(CMS_TEMPLATES)
    .orderBy("sortOrder", "asc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TemplateItem);
}

export async function getTemplate(
  id: string
): Promise<TemplateItem | null> {
  const doc = await db.collection(CMS_TEMPLATES).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as TemplateItem;
}

export async function createTemplate(
  template: TemplateItem
): Promise<void> {
  await db.collection(CMS_TEMPLATES).doc(template.id).set(template);
}

export async function updateTemplate(
  id: string,
  data: Partial<TemplateItem>
): Promise<void> {
  await db.collection(CMS_TEMPLATES).doc(id).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.collection(CMS_TEMPLATES).doc(id).delete();
}

export async function getNextTemplateId(): Promise<string> {
  const templates = await getAllTemplates();
  const maxNum = templates.reduce((max, t) => {
    const n = parseInt(t.id.replace("t", ""));
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `t${String(maxNum + 1).padStart(3, "0")}`;
}

/** Build full TemplatesJson from Firestore (for export/publish). */
export async function buildTemplatesJson(): Promise<TemplatesJson> {
  const [meta, templates] = await Promise.all([
    getTemplatesMeta(),
    getAllTemplates(),
  ]);

  return {
    version: (meta.version as string) || "1.0.0",
    updatedAt: (meta.updatedAt as string) || new Date().toISOString(),
    imageBaseUrl:
      (meta.imageBaseUrl as string) || DEFAULT_TEMPLATES_META.imageBaseUrl,
    imageSuffix: (meta.imageSuffix as string) || ".webp",
    defaults: (meta.defaults as TemplatesJson["defaults"]) ||
      DEFAULT_TEMPLATES_META.defaults,
    categories: (meta.categories as TemplatesJson["categories"]) || [],
    types: (meta.types as TemplatesJson["types"]) || [],
    genders: (meta.genders as TemplatesJson["genders"]) || [],
    templates,
  };
}

// ── Stories CRUD ──

export async function getStoriesMeta(): Promise<Record<string, unknown>> {
  const doc = await db.collection(CMS_META).doc("stories").get();
  if (!doc.exists) return { ...DEFAULT_STORIES_META };
  return doc.data() as Record<string, unknown>;
}

export async function saveStoriesMeta(
  meta: Record<string, unknown>
): Promise<void> {
  meta.updatedAt = new Date().toISOString();
  await db.collection(CMS_META).doc("stories").set(meta, { merge: true });
}

export async function getAllStories(): Promise<StoryItem[]> {
  const snap = await db
    .collection(CMS_STORIES)
    .orderBy("sortOrder", "asc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StoryItem);
}

export async function getStory(id: string): Promise<StoryItem | null> {
  const doc = await db.collection(CMS_STORIES).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as StoryItem;
}

export async function createStory(story: StoryItem): Promise<void> {
  await db.collection(CMS_STORIES).doc(story.id).set(story);
}

export async function updateStory(
  id: string,
  data: Partial<StoryItem>
): Promise<void> {
  await db.collection(CMS_STORIES).doc(id).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteStory(id: string): Promise<void> {
  await db.collection(CMS_STORIES).doc(id).delete();
}

export async function getNextStoryId(): Promise<string> {
  const stories = await getAllStories();
  const maxNum = stories.reduce((max, s) => {
    const n = parseInt(s.id.replace("s", ""));
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `s${String(maxNum + 1).padStart(3, "0")}`;
}

/** Build full StoriesJson from Firestore (for export/publish). */
export async function buildStoriesJson(): Promise<StoriesJson> {
  const [meta, stories] = await Promise.all([
    getStoriesMeta(),
    getAllStories(),
  ]);

  return {
    version: (meta.version as string) || "1.0.0",
    updatedAt: (meta.updatedAt as string) || new Date().toISOString(),
    imageBaseUrl:
      (meta.imageBaseUrl as string) || DEFAULT_STORIES_META.imageBaseUrl,
    imageSuffix: (meta.imageSuffix as string) || ".webp",
    categories: (meta.categories as StoriesJson["categories"]) || [],
    types: (meta.types as StoriesJson["types"]) || [],
    genders: (meta.genders as StoriesJson["genders"]) || [],
    durations: (meta.durations as StoriesJson["durations"]) || [],
    stories,
  };
}

// ── Publish: Export to GCS + Sync to CF collections ──

/** Export templates from Firestore → GCS JSON file. */
export async function exportTemplatesToGcs(
  json: TemplatesJson
): Promise<string> {
  const content = JSON.stringify(json, null, 2);
  const url = await uploadToGcs(
    Buffer.from(content, "utf-8"),
    GCS_TEMPLATES_PATH,
    "application/json"
  );
  return url;
}

/** Export stories from Firestore → GCS JSON file. */
export async function exportStoriesToGcs(
  json: StoriesJson
): Promise<string> {
  const content = JSON.stringify(json, null, 2);
  const url = await uploadToGcs(
    Buffer.from(content, "utf-8"),
    GCS_STORIES_PATH,
    "application/json"
  );
  return url;
}

/**
 * Sync CMS templates → CF `templates` collection.
 * Transforms CMS TemplateItem → CF template doc format.
 */
export async function syncTemplatesToCF(
  templates: TemplateItem[]
): Promise<number> {
  const batch = db.batch();
  let count = 0;

  for (const t of templates) {
    if (!t.isActive) continue;

    const cfDoc = db.collection(CF_TEMPLATES).doc(t.id);
    batch.set(cfDoc, {
      name: t.name?.en || t.slug || t.id,
      isActive: t.isActive,
      isPremium: t.premium,
      promptTemplate: t.prompt?.base || "",
      style: t.style || "",
      category: t.category || "",
      negativePrompt: t.prompt?.negative || "",
      imagenParams: {
        aspectRatio: t.aiConfig?.aspectRatios?.[0] || "1:1",
        guidanceScale: t.aiConfig?.guidanceScale ?? 7.5,
      },
      usageCount: 0, // Don't reset — use merge
      credits: t.credits ?? 1,
      slug: t.slug || "",
      tags: t.tags || [],
      coverImage: t.coverImage || "",
      gender: t.gender || "all",
      updatedAt: new Date().toISOString(),
    }, { merge: true }); // merge to preserve usageCount

    count++;

    // Firestore batches support max 500 operations
    if (count % 450 === 0) {
      await batch.commit();
    }
  }

  await batch.commit();
  return count;
}

/**
 * Sync CMS stories → CF `storyPacks` collection + `scenes` subcollection.
 * Transforms CMS StoryItem → CF storyPack + scenes format.
 */
export async function syncStoriesToCF(
  stories: StoryItem[]
): Promise<number> {
  let count = 0;

  for (const s of stories) {
    if (!s.isActive) continue;

    const packRef = db.collection(CF_STORY_PACKS).doc(s.id);

    // Write storyPack doc
    await packRef.set(
      {
        name: s.title?.en || s.slug || s.id,
        description: s.description?.en || "",
        category: s.category || "adventure",
        previewUrls: s.previewImages || [],
        totalScenes: s.chapters?.length || 0,
        creditsCost: s.credits ?? 5,
        isPremium: s.premium,
        isActive: s.isActive,
        sortOrder: s.sortOrder ?? 0,
        coverImage: s.coverImage || "",
        slug: s.slug || "",
        tags: s.tags || [],
        gender: s.gender || "all",
        updatedAt: new Date().toISOString(),
      },
      { merge: true } // preserve usageCount
    );

    // Write scenes subcollection
    if (s.chapters?.length) {
      const sceneBatch = db.batch();
      for (let i = 0; i < s.chapters.length; i++) {
        const ch = s.chapters[i];
        const sceneRef = packRef
          .collection("scenes")
          .doc(`scene_${i + 1}`);

        sceneBatch.set(sceneRef, {
          sceneOrder: ch.order ?? i + 1,
          sceneName: ch.heading?.en || `Scene ${i + 1}`,
          promptTemplate: ch.prompt?.base || "",
          negativePrompt: ch.prompt?.negative || "",
          styleHint: ch.prompt?.styleHint || "",
          imagenParams: {
            guidanceScale: ch.aiConfig?.guidanceScale ?? 7.5,
            aspectRatio: ch.aiConfig?.aspectRatio || "9:16",
          },
        });
      }
      await sceneBatch.commit();
    }

    count++;
  }

  return count;
}

// ── Version Snapshots (still GCS-based) ──

function manifestGcsPath(type: ContentType): string {
  return `config/versions/${type}_manifest.json`;
}

function versionGcsPath(type: ContentType, version: string): string {
  return `config/versions/${type}_v${version}.json`;
}

// In-memory caches for version data
const versionCache = new Map<string, TemplatesJson | StoriesJson>();
const manifestCache = new Map<string, VersionManifest>();

export async function getManifest(
  type: ContentType
): Promise<VersionManifest> {
  const cached = manifestCache.get(type);
  if (cached) return cached;

  try {
    const buf = await downloadFromGcs(manifestGcsPath(type));
    const manifest = JSON.parse(buf.toString("utf-8")) as VersionManifest;
    manifestCache.set(type, manifest);
    return manifest;
  } catch {
    // Auto-create manifest from current Firestore data
    const json =
      type === "templates"
        ? await buildTemplatesJson()
        : await buildStoriesJson();

    const items =
      type === "templates"
        ? (json as TemplatesJson).templates
        : (json as StoriesJson).stories;

    const activeCount = items.filter((i) => i.isActive).length;

    const manifest: VersionManifest = {
      published: json.version,
      versions: [
        {
          version: json.version,
          status: "published",
          created_at: json.updatedAt || new Date().toISOString(),
          published_at: json.updatedAt || new Date().toISOString(),
          item_count: items.length,
          active_count: activeCount,
          note: "Initial release",
        },
      ],
    };

    await saveManifest(type, manifest);
    await saveVersionJson(type, json.version, json);
    return manifest;
  }
}

export async function saveManifest(
  type: ContentType,
  manifest: VersionManifest
): Promise<void> {
  const content = JSON.stringify(manifest, null, 2);
  try {
    await uploadToGcs(
      Buffer.from(content, "utf-8"),
      manifestGcsPath(type),
      "application/json"
    );
  } catch (e) {
    console.warn(
      "Failed to save manifest to GCS:",
      (e as Error).message
    );
  }
  manifestCache.set(type, manifest);
}

export async function getVersionJson<
  T extends TemplatesJson | StoriesJson,
>(type: ContentType, version: string): Promise<T> {
  const key = `${type}:${version}`;
  const cached = versionCache.get(key);
  if (cached) return cached as T;

  const gcsPath = versionGcsPath(type, version);
  const buf = await downloadFromGcs(gcsPath);
  const data = JSON.parse(buf.toString("utf-8")) as T;
  versionCache.set(key, data);
  return data;
}

export async function saveVersionJson(
  type: ContentType,
  version: string,
  data: TemplatesJson | StoriesJson
): Promise<void> {
  const gcsPath = versionGcsPath(type, version);
  const content = JSON.stringify(data, null, 2);
  try {
    await uploadToGcs(
      Buffer.from(content, "utf-8"),
      gcsPath,
      "application/json"
    );
  } catch (e) {
    console.warn(
      `Failed to save version ${version} to GCS:`,
      (e as Error).message
    );
  }
  versionCache.set(`${type}:${version}`, data);
}

export function bumpVersion(current: string): string {
  const parts = current.split(".").map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join(".");
}

function bumpMinor(current: string): string {
  const parts = current.split(".").map(Number);
  parts[1] = (parts[1] || 0) + 1;
  parts[2] = 0;
  return parts.join(".");
}

export async function createVersion(
  type: ContentType,
  copyFrom: string | undefined,
  note: string
): Promise<VersionInfo> {
  const manifest = await getManifest(type);

  const sourceVersion = copyFrom || manifest.published;
  const sourceInfo = manifest.versions.find(
    (v) => v.version === sourceVersion
  );
  if (!sourceInfo)
    throw new Error(`Source version ${sourceVersion} not found`);

  const allVersions = manifest.versions.map((v) => v.version);
  let nextVersion = bumpMinor(sourceVersion);
  while (allVersions.includes(nextVersion)) {
    nextVersion = bumpMinor(nextVersion);
  }

  // Copy source JSON (try GCS version snapshot, fallback to Firestore)
  let sourceJson: TemplatesJson | StoriesJson;
  try {
    sourceJson = await getVersionJson(type, sourceVersion);
  } catch {
    sourceJson =
      type === "templates"
        ? await buildTemplatesJson()
        : await buildStoriesJson();
  }

  const newJson = JSON.parse(JSON.stringify(sourceJson));
  newJson.version = nextVersion;
  newJson.updatedAt = new Date().toISOString();

  const items =
    type === "templates"
      ? (newJson as TemplatesJson).templates
      : (newJson as StoriesJson).stories;

  const newInfo: VersionInfo = {
    version: nextVersion,
    status: "review",
    created_at: new Date().toISOString(),
    item_count: items.length,
    active_count: items.filter((i) => i.isActive).length,
    note,
  };

  await saveVersionJson(type, nextVersion, newJson);
  manifest.versions.push(newInfo);
  await saveManifest(type, manifest);

  return newInfo;
}

export async function deleteVersion(
  type: ContentType,
  version: string
): Promise<void> {
  const manifest = await getManifest(type);
  const info = manifest.versions.find((v) => v.version === version);
  if (!info) throw new Error(`Version ${version} not found`);
  if (info.status === "published")
    throw new Error("Cannot delete published version");

  manifest.versions = manifest.versions.filter(
    (v) => v.version !== version
  );
  await saveManifest(type, manifest);
  versionCache.delete(`${type}:${version}`);
}

/**
 * Publish a review version:
 * 1. Load version JSON from GCS
 * 2. Write all items to Firestore (cms_templates/cms_stories)
 * 3. Update manifest
 */
export async function publishVersion(
  type: ContentType,
  version: string
): Promise<TemplatesJson | StoriesJson> {
  const manifest = await getManifest(type);
  const info = manifest.versions.find((v) => v.version === version);
  if (!info) throw new Error(`Version ${version} not found`);
  if (info.status !== "review")
    throw new Error(`Version ${version} is not in review status`);

  const versionJson = await getVersionJson<TemplatesJson | StoriesJson>(
    type,
    version
  );

  // Archive previously published version
  for (const v of manifest.versions) {
    if (v.status === "published") {
      v.status = "archived";
    }
  }

  // Promote this version
  info.status = "published";
  info.published_at = new Date().toISOString();
  manifest.published = version;

  versionJson.version = version;
  versionJson.updatedAt = new Date().toISOString();

  // Write items from version to Firestore (replace canonical data)
  if (type === "templates") {
    await importTemplatesToFirestore(versionJson as TemplatesJson);
  } else {
    await importStoriesToFirestore(versionJson as StoriesJson);
  }

  // Save updated version snapshot + manifest
  await saveVersionJson(type, version, versionJson);
  await saveManifest(type, manifest);

  return versionJson;
}

// ── Migration / Import helpers ──

/**
 * Import templates from a TemplatesJson object into Firestore.
 * Replaces all docs in cms_templates.
 */
export async function importTemplatesToFirestore(
  json: TemplatesJson
): Promise<number> {
  // Save metadata
  await saveTemplatesMeta({
    version: json.version,
    updatedAt: json.updatedAt,
    imageBaseUrl: json.imageBaseUrl,
    imageSuffix: json.imageSuffix,
    defaults: json.defaults,
    categories: json.categories,
    types: json.types,
    genders: json.genders,
  });

  // Delete existing docs
  const existing = await db.collection(CMS_TEMPLATES).listDocuments();
  if (existing.length > 0) {
    const delBatch = db.batch();
    for (const doc of existing) {
      delBatch.delete(doc);
    }
    await delBatch.commit();
  }

  // Write new docs
  let count = 0;
  let batch = db.batch();
  for (const t of json.templates) {
    batch.set(db.collection(CMS_TEMPLATES).doc(t.id), t);
    count++;
    if (count % 450 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();

  return count;
}

/**
 * Import stories from a StoriesJson object into Firestore.
 * Replaces all docs in cms_stories.
 */
export async function importStoriesToFirestore(
  json: StoriesJson
): Promise<number> {
  // Save metadata
  await saveStoriesMeta({
    version: json.version,
    updatedAt: json.updatedAt,
    imageBaseUrl: json.imageBaseUrl,
    imageSuffix: json.imageSuffix,
    categories: json.categories,
    types: json.types,
    genders: json.genders,
    durations: json.durations,
  });

  // Delete existing docs
  const existing = await db.collection(CMS_STORIES).listDocuments();
  if (existing.length > 0) {
    const delBatch = db.batch();
    for (const doc of existing) {
      delBatch.delete(doc);
    }
    await delBatch.commit();
  }

  // Write new docs
  let count = 0;
  let batch = db.batch();
  for (const s of json.stories) {
    batch.set(db.collection(CMS_STORIES).doc(s.id), s);
    count++;
    if (count % 450 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();

  return count;
}

/**
 * Migrate existing GCS JSON data into Firestore.
 * Call this once to initialize Firestore from current GCS data.
 */
export async function migrateFromGcs(): Promise<{
  templates: number;
  stories: number;
}> {
  let templatesCount = 0;
  let storiesCount = 0;

  try {
    const templatesBuf = await downloadFromGcs(GCS_TEMPLATES_PATH);
    const templatesJson = JSON.parse(
      templatesBuf.toString("utf-8")
    ) as TemplatesJson;
    templatesCount = await importTemplatesToFirestore(templatesJson);
    console.log(`Migrated ${templatesCount} templates to Firestore`);
  } catch (e) {
    console.warn("No templates JSON in GCS to migrate:", (e as Error).message);
  }

  try {
    const storiesBuf = await downloadFromGcs(GCS_STORIES_PATH);
    const storiesJson = JSON.parse(
      storiesBuf.toString("utf-8")
    ) as StoriesJson;
    storiesCount = await importStoriesToFirestore(storiesJson);
    console.log(`Migrated ${storiesCount} stories to Firestore`);
  } catch (e) {
    console.warn("No stories JSON in GCS to migrate:", (e as Error).message);
  }

  return { templates: templatesCount, stories: storiesCount };
}

export function invalidateCache(type: "templates" | "stories" | "all") {
  if (type === "templates" || type === "all") {
    manifestCache.delete("templates");
    Array.from(versionCache.keys()).forEach((key) => {
      if (key.startsWith("templates:")) versionCache.delete(key);
    });
  }
  if (type === "stories" || type === "all") {
    manifestCache.delete("stories");
    Array.from(versionCache.keys()).forEach((key) => {
      if (key.startsWith("stories:")) versionCache.delete(key);
    });
  }
}
