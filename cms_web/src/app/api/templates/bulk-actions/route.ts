import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/templates/bulk-actions
 *
 * Body:
 *   - templateIds: string[]
 *   - action: "activate" | "deactivate" | "delete" | "setBadge" | "setPremium" | "setCredits"
 *   - value?: string | number | boolean (depends on action)
 */
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { templateIds, action, value } = await request.json();

    if (!Array.isArray(templateIds) || templateIds.length === 0 || !action) {
      return NextResponse.json(
        { error: "templateIds (array) and action are required" },
        { status: 400 }
      );
    }

    if (templateIds.length > 100) {
      return NextResponse.json(
        { error: "Max 100 templates per batch" },
        { status: 400 }
      );
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "activate":
        updateData = { isActive: true };
        break;
      case "deactivate":
        updateData = { isActive: false };
        break;
      case "setBadge":
        updateData = { badge: value || null };
        break;
      case "setPremium":
        updateData = { premium: !!value };
        break;
      case "setCredits":
        if (typeof value !== "number" || value < 0) {
          return NextResponse.json(
            { error: "Credits must be a non-negative number" },
            { status: 400 }
          );
        }
        updateData = { credits: value };
        break;
      case "delete":
        // Delete from both collections
        const deleteBatch = db.batch();
        for (const id of templateIds) {
          deleteBatch.delete(db.collection("cms_templates").doc(id));
          deleteBatch.delete(db.collection("templates").doc(id));
        }
        await deleteBatch.commit();
        return NextResponse.json({
          success: true,
          action: "delete",
          count: templateIds.length,
        });
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // Batch update both collections
    const batch = db.batch();
    for (const id of templateIds) {
      const cmsRef = db.collection("cms_templates").doc(id);
      batch.update(cmsRef, {
        ...updateData,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const cfRef = db.collection("templates").doc(id);
      batch.update(cfRef, {
        ...updateData,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      action,
      count: templateIds.length,
      value: updateData,
    });
  } catch (error) {
    console.error("POST /api/templates/bulk-actions failed:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}
