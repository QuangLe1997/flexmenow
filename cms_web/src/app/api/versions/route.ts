import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { getManifest, createVersion } from "@/lib/firestore-store";
import type { ContentType } from "@/lib/types";

// GET /api/versions?type=templates|stories — list all versions
export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as ContentType;
    if (!type || !["templates", "stories"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const manifest = await getManifest(type);
    return NextResponse.json(manifest);
  } catch (error) {
    console.error("GET /api/versions failed:", error);
    return NextResponse.json({ error: "Failed to load versions" }, { status: 500 });
  }
}

// POST /api/versions — create new review version
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const type = body.type as ContentType;
    if (!type || !["templates", "stories"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const info = await createVersion(type, body.copyFrom, body.note || "New version");
    return NextResponse.json(info, { status: 201 });
  } catch (error) {
    console.error("POST /api/versions failed:", error);
    const message = error instanceof Error ? error.message : "Failed to create version";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
