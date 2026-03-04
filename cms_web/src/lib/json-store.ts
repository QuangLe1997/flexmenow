import fs from "fs";
import path from "path";
import { downloadFromGcs, uploadToGcs } from "./gcs";
import type {
  TemplatesJson,
  StoriesJson,
  ContentType,
  VersionManifest,
  VersionInfo,
} from "./types";

const GCS_TEMPLATES_PATH = "config/flexshot_templates.json";
const GCS_STORIES_PATH = "config/flextale_stories.json";

// Local fallback paths (public/config/)
const LOCAL_TEMPLATES_PATH = path.join(process.cwd(), "..", "public", "config", "flexshot_templates.json");
const LOCAL_STORIES_PATH = path.join(process.cwd(), "..", "public", "config", "flextale_stories.json");

// Canonical GCS path for a content type
function canonicalPath(type: ContentType): string {
  return type === "templates" ? GCS_TEMPLATES_PATH : GCS_STORIES_PATH;
}

function localPath(type: ContentType): string {
  return type === "templates" ? LOCAL_TEMPLATES_PATH : LOCAL_STORIES_PATH;
}

function manifestGcsPath(type: ContentType): string {
  return `config/versions/${type}_manifest.json`;
}

function versionGcsPath(type: ContentType, version: string): string {
  return `config/versions/${type}_v${version}.json`;
}

// ── In-memory caches ──

let templatesCache: TemplatesJson | null = null;
let storiesCache: StoriesJson | null = null;
const versionCache = new Map<string, TemplatesJson | StoriesJson>();
const manifestCache = new Map<string, VersionManifest>();

// ── Generic load/save helpers ──

async function loadJson<T>(gcsPath: string, localFallback: string): Promise<T> {
  try {
    const buf = await downloadFromGcs(gcsPath);
    return JSON.parse(buf.toString("utf-8")) as T;
  } catch (e) {
    console.warn(`GCS download failed for ${gcsPath}, trying local fallback...`, (e as Error).message);
  }

  if (fs.existsSync(localFallback)) {
    const data = fs.readFileSync(localFallback, "utf-8");
    return JSON.parse(data) as T;
  }

  throw new Error(`Cannot load ${gcsPath}: GCS failed and no local file at ${localFallback}`);
}

async function saveJson(gcsPath: string, localFallback: string, data: unknown): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  try {
    await uploadToGcs(Buffer.from(content, "utf-8"), gcsPath, "application/json");
  } catch (e) {
    console.warn("GCS upload failed, saving locally:", (e as Error).message);
    const dir = path.dirname(localFallback);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(localFallback, content, "utf-8");
  }
}

// ── Templates (canonical — backward compat) ──

export async function getTemplatesJson(): Promise<TemplatesJson> {
  if (!templatesCache) {
    templatesCache = await loadJson<TemplatesJson>(GCS_TEMPLATES_PATH, LOCAL_TEMPLATES_PATH);
  }
  return templatesCache;
}

export async function saveTemplatesJson(data?: TemplatesJson): Promise<void> {
  const json = data || templatesCache;
  if (!json) throw new Error("No templates data to save");
  json.updatedAt = new Date().toISOString();
  await saveJson(GCS_TEMPLATES_PATH, LOCAL_TEMPLATES_PATH, json);
  templatesCache = json;
}

// ── Stories (canonical — backward compat) ──

export async function getStoriesJson(): Promise<StoriesJson> {
  if (!storiesCache) {
    storiesCache = await loadJson<StoriesJson>(GCS_STORIES_PATH, LOCAL_STORIES_PATH);
  }
  return storiesCache;
}

export async function saveStoriesJson(data?: StoriesJson): Promise<void> {
  const json = data || storiesCache;
  if (!json) throw new Error("No stories data to save");
  json.updatedAt = new Date().toISOString();
  await saveJson(GCS_STORIES_PATH, LOCAL_STORIES_PATH, json);
  storiesCache = json;
}

// ── Version Bump ──

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

// ── Manifest CRUD ──

export async function getManifest(type: ContentType): Promise<VersionManifest> {
  const cached = manifestCache.get(type);
  if (cached) return cached;

  try {
    const buf = await downloadFromGcs(manifestGcsPath(type));
    const manifest = JSON.parse(buf.toString("utf-8")) as VersionManifest;
    manifestCache.set(type, manifest);
    return manifest;
  } catch {
    // Auto-create manifest from existing canonical JSON
    const canonical = type === "templates"
      ? await getTemplatesJson()
      : await getStoriesJson();

    const items = type === "templates"
      ? (canonical as TemplatesJson).templates
      : (canonical as StoriesJson).stories;

    const activeCount = items.filter((i) => i.isActive).length;

    const manifest: VersionManifest = {
      published: canonical.version,
      versions: [
        {
          version: canonical.version,
          status: "published",
          created_at: canonical.updatedAt || new Date().toISOString(),
          published_at: canonical.updatedAt || new Date().toISOString(),
          item_count: items.length,
          active_count: activeCount,
          note: "Initial release",
        },
      ],
    };

    // Save the auto-created manifest + snapshot
    await saveManifest(type, manifest);
    await saveVersionJson(type, canonical.version, canonical);
    return manifest;
  }
}

export async function saveManifest(type: ContentType, manifest: VersionManifest): Promise<void> {
  const content = JSON.stringify(manifest, null, 2);
  try {
    await uploadToGcs(Buffer.from(content, "utf-8"), manifestGcsPath(type), "application/json");
  } catch (e) {
    console.warn("Failed to save manifest to GCS:", (e as Error).message);
  }
  manifestCache.set(type, manifest);
}

// ── Version JSON CRUD ──

export async function getVersionJson<T extends TemplatesJson | StoriesJson>(
  type: ContentType,
  version: string
): Promise<T> {
  const key = `${type}:${version}`;
  const cached = versionCache.get(key);
  if (cached) return cached as T;

  const gcsPath = versionGcsPath(type, version);
  const data = await loadJson<T>(gcsPath, "");
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
    await uploadToGcs(Buffer.from(content, "utf-8"), gcsPath, "application/json");
  } catch (e) {
    console.warn(`Failed to save version ${version} to GCS:`, (e as Error).message);
  }
  versionCache.set(`${type}:${version}`, data);
}

// ── Create Version ──

export async function createVersion(
  type: ContentType,
  copyFrom: string | undefined,
  note: string
): Promise<VersionInfo> {
  const manifest = await getManifest(type);

  // Determine source version
  const sourceVersion = copyFrom || manifest.published;
  const sourceInfo = manifest.versions.find((v) => v.version === sourceVersion);
  if (!sourceInfo) throw new Error(`Source version ${sourceVersion} not found`);

  // Auto-generate next minor version
  const allVersions = manifest.versions.map((v) => v.version);
  let nextVersion = bumpMinor(sourceVersion);
  while (allVersions.includes(nextVersion)) {
    nextVersion = bumpMinor(nextVersion);
  }

  // Copy source JSON
  let sourceJson: TemplatesJson | StoriesJson;
  try {
    sourceJson = await getVersionJson(type, sourceVersion);
  } catch {
    // Fallback: load from canonical
    sourceJson = type === "templates"
      ? await getTemplatesJson()
      : await getStoriesJson();
  }

  // Update version in the copied JSON
  const newJson = JSON.parse(JSON.stringify(sourceJson));
  newJson.version = nextVersion;
  newJson.updatedAt = new Date().toISOString();

  const items = type === "templates"
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

  // Save version JSON + update manifest
  await saveVersionJson(type, nextVersion, newJson);
  manifest.versions.push(newInfo);
  await saveManifest(type, manifest);

  return newInfo;
}

// ── Delete Version ──

export async function deleteVersion(type: ContentType, version: string): Promise<void> {
  const manifest = await getManifest(type);
  const info = manifest.versions.find((v) => v.version === version);
  if (!info) throw new Error(`Version ${version} not found`);
  if (info.status === "published") throw new Error("Cannot delete published version");

  manifest.versions = manifest.versions.filter((v) => v.version !== version);
  await saveManifest(type, manifest);
  versionCache.delete(`${type}:${version}`);
}

// ── Publish Version ──

export async function publishVersion(
  type: ContentType,
  version: string
): Promise<TemplatesJson | StoriesJson> {
  const manifest = await getManifest(type);
  const info = manifest.versions.find((v) => v.version === version);
  if (!info) throw new Error(`Version ${version} not found`);
  if (info.status !== "review") throw new Error(`Version ${version} is not in review status`);

  // Load the version JSON
  const versionJson = await getVersionJson<TemplatesJson | StoriesJson>(type, version);

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

  // Copy to canonical file
  versionJson.version = version;
  versionJson.updatedAt = new Date().toISOString();

  if (type === "templates") {
    await saveTemplatesJson(versionJson as TemplatesJson);
  } else {
    await saveStoriesJson(versionJson as StoriesJson);
  }

  // Save updated version snapshot + manifest
  await saveVersionJson(type, version, versionJson);
  await saveManifest(type, manifest);

  return versionJson;
}

// ── Cache Management ──

export function invalidateCache(type: "templates" | "stories" | "all") {
  if (type === "templates" || type === "all") {
    templatesCache = null;
    manifestCache.delete("templates");
    Array.from(versionCache.keys()).forEach((key) => {
      if (key.startsWith("templates:")) versionCache.delete(key);
    });
  }
  if (type === "stories" || type === "all") {
    storiesCache = null;
    manifestCache.delete("stories");
    Array.from(versionCache.keys()).forEach((key) => {
      if (key.startsWith("stories:")) versionCache.delete(key);
    });
  }
}
