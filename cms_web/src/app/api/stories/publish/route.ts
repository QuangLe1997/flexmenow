import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import {
  buildStoriesJson,
  exportStoriesToGcs,
  syncStoriesToCF,
  publishVersion,
  getStoriesMeta,
  saveStoriesMeta,
  bumpVersion,
} from "@/lib/firestore-store";
import { pushRemoteConfig } from "@/lib/remote-config";
import type { StoriesJson } from "@/lib/types";

const IMAGE_BASE_URL =
  "https://firebasestorage.googleapis.com/v0/b/flexme-now.firebasestorage.app/o/";
const GCS_JSON_URL = `${IMAGE_BASE_URL}config%2Fflextale_stories.json?alt=media`;

// POST /api/stories/publish — publish Firestore → GCS + CF + Remote Config
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: { version?: string } = {};
    try {
      body = await request.json();
    } catch {
      // No body = publish current Firestore data
    }

    let json: StoriesJson;

    if (body.version) {
      const result = await publishVersion("stories", body.version);
      json = result as StoriesJson;
    } else {
      const meta = await getStoriesMeta();
      const newVersion = bumpVersion((meta.version as string) || "1.0.0");
      await saveStoriesMeta({ ...meta, version: newVersion });
      json = await buildStoriesJson();
    }

    // 1. Export to GCS JSON (for mobile app)
    await exportStoriesToGcs(json);

    // 2. Sync to CF `storyPacks` collection + scenes
    const cfCount = await syncStoriesToCF(json.stories);
    console.log(`Synced ${cfCount} stories to CF storyPacks collection`);

    // 3. Push cache-busting URL to Remote Config
    const cacheBustUrl = `${GCS_JSON_URL}&t=${Date.now()}`;
    await pushRemoteConfig({ flextale_json_url: cacheBustUrl });

    const activeCount = json.stories.filter((s) => s.isActive).length;

    return NextResponse.json({
      success: true,
      version: json.version,
      count: json.stories.length,
      activeCount,
      cfSynced: cfCount,
      url: cacheBustUrl,
    });
  } catch (error) {
    console.error("POST /api/stories/publish failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to publish stories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
