import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import {
  getTemplate,
  getAllTemplates,
  getNextTemplateId,
  createTemplate,
} from "@/lib/firestore-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const template = await getTemplate(id);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const newId = await getNextTemplateId();
    const allTemplates = await getAllTemplates();
    const now = new Date().toISOString();

    // Clone with new ID, append (Copy) to name, set inactive
    const cloned = {
      ...template,
      id: newId,
      slug: `${template.slug}_copy`,
      name: {
        ...template.name,
        en: `${template.name.en || ""} (Copy)`,
      },
      isActive: false,
      sortOrder: allTemplates.length + 1,
      stats: { likes: 0, views: 0, generates: 0 },
      createdAt: now,
      updatedAt: now,
    };

    await createTemplate(cloned);

    return NextResponse.json(cloned, { status: 201 });
  } catch (error) {
    console.error("Duplicate template failed:", error);
    return NextResponse.json(
      { error: "Failed to duplicate template" },
      { status: 500 }
    );
  }
}
