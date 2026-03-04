import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import {
  getAllStories,
  getNextStoryId,
  createStory,
  buildStoriesJson,
  getVersionJson,
  saveVersionJson,
  getManifest,
} from "@/lib/firestore-store";
import type { StoryItem, StoriesJson } from "@/lib/types";

function isPublished(
  manifest: { versions: { version: string; status: string }[] },
  version: string
) {
  const v = manifest.versions.find((i) => i.version === version);
  return v?.status === "published" || v?.status === "archived";
}

// GET /api/stories — list with search, filter, pagination
export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const version = searchParams.get("version");

    let stories: StoryItem[];
    let jsonVersion: string;

    if (version) {
      const json = await getVersionJson<StoriesJson>("stories", version);
      stories = json.stories;
      jsonVersion = json.version;
    } else {
      stories = await getAllStories();
      const json = await buildStoriesJson();
      jsonVersion = json.version;
    }

    let filtered = stories;

    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.title.en?.toLowerCase().includes(search) ||
          s.id.toLowerCase().includes(search) ||
          s.slug?.toLowerCase().includes(search) ||
          s.tags?.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    if (category) {
      filtered = filtered.filter((s) => s.category === category);
    }

    filtered.sort((a, b) => a.sortOrder - b.sortOrder);

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return NextResponse.json({
      stories: paged,
      total,
      page,
      totalPages,
      version: jsonVersion,
    });
  } catch (error) {
    console.error("GET /api/stories failed:", error);
    return NextResponse.json(
      { error: "Failed to load stories" },
      { status: 500 }
    );
  }
}

// POST /api/stories — create new story
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get("version");

    // Version-specific create → GCS
    if (version) {
      const manifest = await getManifest("stories");
      if (isPublished(manifest, version)) {
        return NextResponse.json(
          { error: "Cannot modify a published version" },
          { status: 403 }
        );
      }

      const body = await request.json();
      const json = await getVersionJson<StoriesJson>("stories", version);

      const maxNum = json.stories.reduce((max, s) => {
        const n = parseInt(s.id.replace("s", ""));
        return isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const newId = `s${String(maxNum + 1).padStart(3, "0")}`;
      const now = new Date().toISOString();

      const story = buildStoryItem(newId, body, json.stories.length, now);
      json.stories.push(story);
      await saveVersionJson("stories", version, json);
      return NextResponse.json(story, { status: 201 });
    }

    // Canonical create → Firestore
    const body = await request.json();
    const newId = await getNextStoryId();
    const stories = await getAllStories();
    const now = new Date().toISOString();

    const story = buildStoryItem(newId, body, stories.length, now);
    await createStory(story);

    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    console.error("POST /api/stories failed:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    );
  }
}

function buildStoryItem(
  id: string,
  body: Record<string, unknown>,
  currentCount: number,
  now: string
): StoryItem {
  const chapters = (body.chapters as StoryItem["chapters"]) || [];
  return {
    id,
    slug:
      (body.slug as string) ||
      (body.title as { en?: string })?.en?.toLowerCase().replace(/\s+/g, "_") ||
      id,
    title: (body.title as StoryItem["title"]) || { en: "" },
    description: (body.description as StoryItem["description"]) || { en: "" },
    category: (body.category as string) || "adventure",
    type: (body.type as string) || "story",
    gender: (body.gender as string) || "all",
    duration: (body.duration as string) || "once",
    totalPics: (body.totalPics as number) ?? chapters.length,
    credits: (body.credits as number) ?? 5,
    badge: (body.badge as string) || null,
    premium: (body.premium as boolean) ?? false,
    isActive: (body.isActive as boolean) ?? true,
    sortOrder: (body.sortOrder as number) ?? currentCount + 1,
    coverImage: (body.coverImage as string) || "",
    previewImages: (body.previewImages as string[]) || [],
    chapters,
    tags: (body.tags as string[]) || [],
    stats: { likes: 0, views: 0, generates: 0 },
    createdAt: now,
    updatedAt: now,
  };
}
