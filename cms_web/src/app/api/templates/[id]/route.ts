import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import {
  getTemplate,
  updateTemplate,
  deleteTemplate as deleteTemplateFromFs,
  getVersionJson,
  saveVersionJson,
  getManifest,
} from "@/lib/firestore-store";
import type { TemplatesJson } from "@/lib/types";

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

// GET /api/templates/[id]
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
      // Load from GCS version snapshot
      const json = await getVersionJson<TemplatesJson>("templates", version);
      const template = json.templates.find((t) => t.id === id);
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(template);
    }

    // Load from Firestore
    const template = await getTemplate(id);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("GET /api/templates/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to load template" },
      { status: 500 }
    );
  }
}

// PUT /api/templates/[id]
export async function PUT(request: Request, context: RouteContext) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const version = searchParams.get("version");

    // Version-specific update → GCS
    if (version) {
      const manifest = await getManifest("templates");
      if (isReadOnly(manifest, version)) {
        return NextResponse.json(
          { error: "Cannot modify a published version" },
          { status: 403 }
        );
      }

      const body = await request.json();
      const json = await getVersionJson<TemplatesJson>("templates", version);
      const idx = json.templates.findIndex((t) => t.id === id);
      if (idx === -1) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      const existing = json.templates[idx];
      const updated = {
        ...existing,
        ...body,
        id: existing.id,
        updatedAt: new Date().toISOString(),
        premium: body.premium ?? body.isPremium ?? existing.premium,
      };
      delete (updated as Record<string, unknown>).isPremium;
      json.templates[idx] = updated;
      await saveVersionJson("templates", version, json);
      return NextResponse.json(updated);
    }

    // Canonical update → Firestore
    const body = await request.json();
    const existing = await getTemplate(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Normalize premium field
    if ("isPremium" in body) {
      body.premium = body.isPremium;
      delete body.isPremium;
    }

    // Prevent ID override
    delete body.id;

    await updateTemplate(id, body);

    const updated = { ...existing, ...body, id, updatedAt: new Date().toISOString() };
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/templates/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id]
export async function DELETE(request: Request, context: RouteContext) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const version = searchParams.get("version");

    // Version-specific delete → GCS
    if (version) {
      const manifest = await getManifest("templates");
      if (isReadOnly(manifest, version)) {
        return NextResponse.json(
          { error: "Cannot modify a published version" },
          { status: 403 }
        );
      }

      const json = await getVersionJson<TemplatesJson>("templates", version);
      const idx = json.templates.findIndex((t) => t.id === id);
      if (idx === -1) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
      json.templates.splice(idx, 1);
      await saveVersionJson("templates", version, json);
      return NextResponse.json({ success: true });
    }

    // Canonical delete → Firestore
    const existing = await getTemplate(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    await deleteTemplateFromFs(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/templates/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
