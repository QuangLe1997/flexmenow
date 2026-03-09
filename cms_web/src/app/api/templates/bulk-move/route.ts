import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { templateIds, targetCategory } = await request.json();

    if (
      !Array.isArray(templateIds) ||
      templateIds.length === 0 ||
      !targetCategory
    ) {
      return NextResponse.json(
        { error: "templateIds (array) and targetCategory are required" },
        { status: 400 }
      );
    }

    // Batch update both cms_templates and templates collections
    const batch = db.batch();

    for (const id of templateIds) {
      const cmsRef = db.collection("cms_templates").doc(id);
      batch.update(cmsRef, {
        category: targetCategory,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const cfRef = db.collection("templates").doc(id);
      batch.update(cfRef, {
        category: targetCategory,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      moved: templateIds.length,
      targetCategory,
    });
  } catch (error) {
    console.error("POST /api/templates/bulk-move failed:", error);
    return NextResponse.json(
      { error: "Failed to move templates" },
      { status: 500 }
    );
  }
}
