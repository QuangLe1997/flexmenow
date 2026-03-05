import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

interface CategoryItem {
  id: string;
  name: Record<string, string>;
  icon?: string;
  color?: string;
  sortOrder: number;
}

// GET /api/templates/categories
export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const metaDoc = await db.collection("cms_meta").doc("templates").get();
    if (!metaDoc.exists) {
      return NextResponse.json({ categories: [] });
    }

    const data = metaDoc.data();
    const categories = (data?.categories || []) as CategoryItem[];
    categories.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return NextResponse.json({
      categories,
      types: data?.types || [],
      genders: data?.genders || [],
    });
  } catch (error) {
    console.error("GET /api/templates/categories failed:", error);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 }
    );
  }
}

// POST /api/templates/categories — Create or update category
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body as { action: string };

    const metaRef = db.collection("cms_meta").doc("templates");
    const metaDoc = await metaRef.get();
    const data = metaDoc.exists ? metaDoc.data() || {} : {};
    const categories = (data.categories || []) as CategoryItem[];

    if (action === "add") {
      const { category } = body as { category: CategoryItem };
      if (!category?.id || !category?.name?.en) {
        return NextResponse.json({ error: "Category id and name.en required" }, { status: 400 });
      }
      if (categories.some((c) => c.id === category.id)) {
        return NextResponse.json({ error: "Category ID already exists" }, { status: 400 });
      }
      categories.push({
        id: category.id,
        name: category.name,
        icon: category.icon || "",
        color: category.color || "",
        sortOrder: category.sortOrder ?? categories.length,
      });
      await metaRef.set({ ...data, categories }, { merge: true });
      return NextResponse.json({ success: true, categories });
    }

    if (action === "update") {
      const { category } = body as { category: CategoryItem };
      const idx = categories.findIndex((c) => c.id === category.id);
      if (idx === -1) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
      categories[idx] = { ...categories[idx], ...category };
      await metaRef.set({ ...data, categories }, { merge: true });
      return NextResponse.json({ success: true, categories });
    }

    if (action === "delete") {
      const { categoryId } = body as { categoryId: string };
      const filtered = categories.filter((c) => c.id !== categoryId);
      if (filtered.length === categories.length) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
      await metaRef.set({ ...data, categories: filtered }, { merge: true });
      return NextResponse.json({ success: true, categories: filtered });
    }

    if (action === "reorder") {
      const { orderedIds } = body as { orderedIds: string[] };
      const reordered = orderedIds
        .map((id, idx) => {
          const cat = categories.find((c) => c.id === id);
          return cat ? { ...cat, sortOrder: idx } : null;
        })
        .filter(Boolean) as CategoryItem[];
      await metaRef.set({ ...data, categories: reordered }, { merge: true });
      return NextResponse.json({ success: true, categories: reordered });
    }

    // Save types/genders lists
    if (action === "saveMeta") {
      const { types, genders } = body as { types?: string[]; genders?: string[] };
      const updates: Record<string, unknown> = {};
      if (types) updates.types = types;
      if (genders) updates.genders = genders;
      await metaRef.set({ ...data, ...updates }, { merge: true });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/templates/categories failed:", error);
    return NextResponse.json(
      { error: "Failed to update categories" },
      { status: 500 }
    );
  }
}
