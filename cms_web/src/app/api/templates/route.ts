import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import {
  getAllTemplates,
  getNextTemplateId,
  createTemplate,
  buildTemplatesJson,
  getVersionJson,
  saveVersionJson,
  getManifest,
} from "@/lib/firestore-store";
import type { TemplateItem, TemplatesJson } from "@/lib/types";

function isPublished(
  manifest: { versions: { version: string; status: string }[] },
  version: string
) {
  const v = manifest.versions.find((i) => i.version === version);
  return v?.status === "published" || v?.status === "archived";
}

// GET /api/templates — list with search, filter, pagination
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

    let templates: TemplateItem[];
    let jsonVersion: string;

    if (version) {
      // Load from GCS version snapshot
      const json = await getVersionJson<TemplatesJson>("templates", version);
      templates = json.templates;
      jsonVersion = json.version;
    } else {
      // Load from Firestore (source of truth)
      templates = await getAllTemplates();
      const json = await buildTemplatesJson();
      jsonVersion = json.version;
    }

    let filtered = templates;

    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.name.en?.toLowerCase().includes(search) ||
          t.id.toLowerCase().includes(search) ||
          t.slug?.toLowerCase().includes(search) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    if (category) {
      filtered = filtered.filter((t) => t.category === category);
    }

    filtered.sort((a, b) => a.sortOrder - b.sortOrder);

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return NextResponse.json({
      templates: paged,
      total,
      page,
      totalPages,
      version: jsonVersion,
    });
  } catch (error) {
    console.error("GET /api/templates failed:", error);
    return NextResponse.json(
      { error: "Failed to load templates" },
      { status: 500 }
    );
  }
}

// POST /api/templates — create new template
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get("version");

    // Version-specific create → GCS (existing behavior)
    if (version) {
      const manifest = await getManifest("templates");
      if (isPublished(manifest, version)) {
        return NextResponse.json(
          { error: "Cannot modify a published version" },
          { status: 403 }
        );
      }

      const body = await request.json();
      const json = await getVersionJson<TemplatesJson>("templates", version);

      const maxNum = json.templates.reduce((max, t) => {
        const n = parseInt(t.id.replace("t", ""));
        return isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const newId = `t${String(maxNum + 1).padStart(3, "0")}`;
      const now = new Date().toISOString();

      const template = buildTemplateItem(newId, body, json.templates.length, now);
      json.templates.push(template);
      await saveVersionJson("templates", version, json);
      return NextResponse.json(template, { status: 201 });
    }

    // Canonical create → Firestore
    const body = await request.json();
    const newId = await getNextTemplateId();
    const templates = await getAllTemplates();
    const now = new Date().toISOString();

    const template = buildTemplateItem(newId, body, templates.length, now);
    await createTemplate(template);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("POST /api/templates failed:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

function buildTemplateItem(
  id: string,
  body: Record<string, unknown>,
  currentCount: number,
  now: string
): TemplateItem {
  return {
    id,
    slug:
      (body.slug as string) ||
      (body.name as { en?: string })?.en?.toLowerCase().replace(/\s+/g, "_") ||
      id,
    name: (body.name as TemplateItem["name"]) || { en: "" },
    category: (body.category as string) || "professional",
    type: (body.type as string) || "headshot",
    gender: (body.gender as string) || "all",
    style: (body.style as string) || "",
    credits: (body.credits as number) ?? 1,
    badge: (body.badge as string) || null,
    premium: (body.premium as boolean) ?? (body.isPremium as boolean) ?? false,
    isActive: (body.isActive as boolean) ?? true,
    sortOrder: (body.sortOrder as number) ?? currentCount + 1,
    coverImage: (body.coverImage as string) || "",
    previewImages: (body.previewImages as string[]) || [],
    prompt: {
      base: (body.prompt as { base?: string })?.base || "",
      negative: (body.prompt as { negative?: string })?.negative || "",
      styleHint: (body.prompt as { styleHint?: string })?.styleHint || "",
    },
    aiConfig: {
      model:
        (body.aiConfig as { model?: string })?.model ||
        "imagen-3.0-generate-002",
      guidanceScale:
        (body.aiConfig as { guidanceScale?: number })?.guidanceScale ?? 7.5,
      numInferenceSteps:
        (body.aiConfig as { numInferenceSteps?: number })?.numInferenceSteps ??
        50,
      aspectRatios:
        (body.aiConfig as { aspectRatios?: string[] })?.aspectRatios || ["1:1"],
    },
    stats: { likes: 0, views: 0, generates: 0 },
    tags: (body.tags as string[]) || [],
    createdAt: now,
    updatedAt: now,
  };
}
