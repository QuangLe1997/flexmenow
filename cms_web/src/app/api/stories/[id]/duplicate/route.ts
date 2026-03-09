import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import {
  getStory,
  getAllStories,
  getNextStoryId,
  createStory,
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
    const story = await getStory(id);
    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    const newId = await getNextStoryId();
    const allStories = await getAllStories();
    const now = new Date().toISOString();

    // Clone with new ID, append (Copy) to title, set inactive
    const cloned = {
      ...story,
      id: newId,
      slug: `${story.slug}_copy`,
      title: {
        ...story.title,
        en: `${story.title.en || ""} (Copy)`,
      },
      isActive: false,
      sortOrder: allStories.length + 1,
      stats: { likes: 0, views: 0, generates: 0 },
      createdAt: now,
      updatedAt: now,
    };

    await createStory(cloned);

    return NextResponse.json(cloned, { status: 201 });
  } catch (error) {
    console.error("Duplicate story failed:", error);
    return NextResponse.json(
      { error: "Failed to duplicate story" },
      { status: 500 }
    );
  }
}
