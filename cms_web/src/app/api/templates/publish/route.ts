import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import {
  buildTemplatesJson,
  exportTemplatesToGcs,
  syncTemplatesToCF,
  publishVersion,
  getTemplatesMeta,
  saveTemplatesMeta,
  bumpVersion,
} from "@/lib/firestore-store";
import { pushRemoteConfig } from "@/lib/remote-config";
import type { TemplatesJson } from "@/lib/types";

const IMAGE_BASE_URL =
  "https://firebasestorage.googleapis.com/v0/b/flexme-now.firebasestorage.app/o/";
const GCS_JSON_URL = `${IMAGE_BASE_URL}config%2Fflexshot_templates.json?alt=media`;

// POST /api/templates/publish — publish Firestore → GCS + CF + Remote Config
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

    let json: TemplatesJson;

    if (body.version) {
      // Publish a specific review version (GCS → Firestore + GCS + CF)
      const result = await publishVersion("templates", body.version);
      json = result as TemplatesJson;
    } else {
      // Publish current Firestore data → bump version → export
      const meta = await getTemplatesMeta();
      const newVersion = bumpVersion((meta.version as string) || "1.0.0");
      await saveTemplatesMeta({ ...meta, version: newVersion });
      json = await buildTemplatesJson();
    }

    // 1. Export to GCS JSON (for mobile app)
    await exportTemplatesToGcs(json);

    // 2. Sync to CF `templates` collection
    const cfCount = await syncTemplatesToCF(json.templates);
    console.log(`Synced ${cfCount} templates to CF collection`);

    // 3. Push cache-busting URL to Remote Config
    const cacheBustUrl = `${GCS_JSON_URL}&t=${Date.now()}`;
    await pushRemoteConfig({ flexshot_json_url: cacheBustUrl });

    const activeCount = json.templates.filter((t) => t.isActive).length;

    return NextResponse.json({
      success: true,
      version: json.version,
      count: json.templates.length,
      activeCount,
      cfSynced: cfCount,
      url: cacheBustUrl,
    });
  } catch (error) {
    console.error("POST /api/templates/publish failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to publish templates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
