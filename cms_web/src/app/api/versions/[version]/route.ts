import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { getManifest, getVersionJson, deleteVersion } from "@/lib/firestore-store";
import type { ContentType } from "@/lib/types";

interface RouteContext {
  params: Promise<{ version: string }>;
}

// GET /api/versions/[version]?type=templates|stories — version detail
export async function GET(request: Request, context: RouteContext) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { version } = await context.params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as ContentType;
    if (!type || !["templates", "stories"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const manifest = await getManifest(type);
    const info = manifest.versions.find((v) => v.version === version);
    if (!info) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const json = await getVersionJson(type, version);
    return NextResponse.json({ info, data: json });
  } catch (error) {
    console.error("GET /api/versions/[version] failed:", error);
    return NextResponse.json({ error: "Failed to load version" }, { status: 500 });
  }
}

// DELETE /api/versions/[version]?type=templates|stories — delete review version
export async function DELETE(request: Request, context: RouteContext) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { version } = await context.params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as ContentType;
    if (!type || !["templates", "stories"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    await deleteVersion(type, version);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/versions/[version] failed:", error);
    const message = error instanceof Error ? error.message : "Failed to delete version";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
