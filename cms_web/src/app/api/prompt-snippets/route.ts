import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export interface PromptSnippet {
  id: string;
  label: string;
  category: "negative" | "style" | "base" | "variable";
  content: string;
  createdAt: string;
}

const COLLECTION = "cms_prompt_snippets";

// GET /api/prompt-snippets
export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snap = await db.collection(COLLECTION).orderBy("category").orderBy("label").get();
    const snippets: PromptSnippet[] = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as PromptSnippet[];
    return NextResponse.json({ snippets });
  } catch (error) {
    console.error("GET /api/prompt-snippets failed:", error);
    return NextResponse.json({ error: "Failed to load snippets" }, { status: 500 });
  }
}

// POST /api/prompt-snippets
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "create") {
      const { label, category, content } = body as {
        label: string;
        category: string;
        content: string;
      };
      if (!label || !category || !content) {
        return NextResponse.json({ error: "label, category, content required" }, { status: 400 });
      }
      const doc = await db.collection(COLLECTION).add({
        label,
        category,
        content,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({
        success: true,
        snippet: { id: doc.id, label, category, content },
      });
    }

    if (action === "update") {
      const { id, label, category, content } = body;
      if (!id) {
        return NextResponse.json({ error: "id required" }, { status: 400 });
      }
      await db.collection(COLLECTION).doc(id).update({
        ...(label && { label }),
        ...(category && { category }),
        ...(content !== undefined && { content }),
      });
      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: "id required" }, { status: 400 });
      }
      await db.collection(COLLECTION).doc(id).delete();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/prompt-snippets failed:", error);
    return NextResponse.json({ error: "Failed to update snippet" }, { status: 500 });
  }
}
