import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import {
  getStory,
  updateStory,
  deleteStory as deleteStoryFromFs,
  getVersionJson,
  saveVersionJson,
  getManifest,
} from "@/lib/firestore-store";
import type { StoriesJson } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function isReadOnly(
  manifest: { versions: { version: string; status: string }[] },
  version: string
) {
  const v = manifest.versions.find((i) => i.version === version);
  return v?.status === "published" || v?.status === "archived";
}

// GET /api/stories/[id]
export async function GET(request: Request, context: RouteContext) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const version = searchParams.get("version");

    if (version) {
      const json = await getVersionJson<StoriesJson>("stories", version);
      const story = json.stories.find((s) => s.id === id);
      if (!story) {
        return NextResponse.json(
          { error: "Story not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(story);
    }

    const story = await getStory(id);
    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(story);
  } catch (error) {
    console.error("GET /api/stories/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to load story" },
      { status: 500 }
    );
  }
}

// PUT /api/stories/[id]
export async function PUT(request: Request, context: RouteContext) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const version = searchParams.get("version");

    if (version) {
      const manifest = await getManifest("stories");
      if (isReadOnly(manifest, version)) {
        return NextResponse.json(
          { error: "Cannot modify a published version" },
          { status: 403 }
        );
      }

      const body = await request.json();
      const json = await getVersionJson<StoriesJson>("stories", version);
      const idx = json.stories.findIndex((s) => s.id === id);
      if (idx === -1) {
        return NextResponse.json(
          { error: "Story not found" },
          { status: 404 }
        );
      }

      const existing = json.stories[idx];
      const updated = {
        ...existing,
        ...body,
        id: existing.id,
        updatedAt: new Date().toISOString(),
      };
      if (body.chapters) {
        updated.totalPics = body.chapters.length;
      }
      json.stories[idx] = updated;
      await saveVersionJson("stories", version, json);
      return NextResponse.json(updated);
    }

    // Canonical update → Firestore
    const body = await request.json();
    const existing = await getStory(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    delete body.id;
    if (body.chapters) {
      body.totalPics = body.chapters.length;
    }

    await updateStory(id, body);

    const updated = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/stories/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update story" },
      { status: 500 }
    );
  }
}

// DELETE /api/stories/[id]
export async function DELETE(request: Request, context: RouteContext) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const version = searchParams.get("version");

    if (version) {
      const manifest = await getManifest("stories");
      if (isReadOnly(manifest, version)) {
        return NextResponse.json(
          { error: "Cannot modify a published version" },
          { status: 403 }
        );
      }

      const json = await getVersionJson<StoriesJson>("stories", version);
      const idx = json.stories.findIndex((s) => s.id === id);
      if (idx === -1) {
        return NextResponse.json(
          { error: "Story not found" },
          { status: 404 }
        );
      }
      json.stories.splice(idx, 1);
      await saveVersionJson("stories", version, json);
      return NextResponse.json({ success: true });
    }

    const existing = await getStory(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    await deleteStoryFromFs(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/stories/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    );
  }
}
