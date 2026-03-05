import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/templates/reorder
 *
 * Body: { orderedIds: string[] }
 * Updates sortOrder for each template based on array index.
 */
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderedIds } = (await request.json()) as { orderedIds: string[] };

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds array required" }, { status: 400 });
    }

    // Firestore batch max 500, split if needed
    const chunks: string[][] = [];
    for (let i = 0; i < orderedIds.length; i += 250) {
      chunks.push(orderedIds.slice(i, i + 250));
    }

    let offset = 0;
    for (const chunk of chunks) {
      const batch = db.batch();
      for (let i = 0; i < chunk.length; i++) {
        const id = chunk[i];
        const sortOrder = offset + i;
        batch.update(db.collection("cms_templates").doc(id), {
          sortOrder,
          updatedAt: FieldValue.serverTimestamp(),
        });
        batch.update(db.collection("templates").doc(id), {
          sortOrder,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      offset += chunk.length;
    }

    return NextResponse.json({ success: true, count: orderedIds.length });
  } catch (error) {
    console.error("POST /api/templates/reorder failed:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
