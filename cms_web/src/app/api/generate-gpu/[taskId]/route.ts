import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

/**
 * GET /api/generate-gpu/[taskId]
 *
 * Poll task status from Firestore.
 * Returns current status, image_url when done, error when failed.
 */
export async function GET(request: Request, context: RouteContext) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await context.params;
  const doc = await db.collection("gen_tasks").doc(taskId).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const data = doc.data()!;
  return NextResponse.json({
    task_id: taskId,
    status: data.status,
    image_url: data.image_url || null,
    output_gcs_path: data.output_gcs_path || null,
    error: data.error || null,
    created_at: data.created_at,
    finished_at: data.finished_at || null,
    elapsed_seconds: data.elapsed_seconds || null,
  });
}
