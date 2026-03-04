import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { migrateFromGcs } from "@/lib/firestore-store";

/**
 * POST /api/migrate
 *
 * One-time migration: reads existing GCS JSON files and imports them into Firestore.
 * This initializes the cms_templates and cms_stories Firestore collections.
 */
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await migrateFromGcs();

    return NextResponse.json({
      success: true,
      message: "Migration complete",
      templates: result.templates,
      stories: result.stories,
    });
  } catch (error) {
    console.error("POST /api/migrate failed:", error);
    const message =
      error instanceof Error ? error.message : "Migration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
