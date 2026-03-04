import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import {
  getTemplate,
  updateTemplate,
  getStory,
  updateStory,
} from "@/lib/firestore-store";

/**
 * POST /api/pubsub/webhook?token=xxx
 *
 * Receives push messages from the `image-gen-results` Pub/Sub subscription.
 * Updates the corresponding gen_task document in Firestore.
 * On "done": also updates the template/story coverImage in Firestore.
 */
export async function POST(request: Request) {
  try {
    // Verify push token (prevents unauthorized calls)
    const pushToken = process.env.PUBSUB_PUSH_TOKEN;
    if (pushToken) {
      const url = new URL(request.url);
      const token = url.searchParams.get("token");
      if (token !== pushToken) {
        return NextResponse.json({ error: "Invalid token" }, { status: 403 });
      }
    }

    const body = await request.json();
    const messageData = body.message?.data;
    if (!messageData) {
      return NextResponse.json({ error: "No message data" }, { status: 400 });
    }

    const data = JSON.parse(
      Buffer.from(messageData, "base64").toString("utf-8")
    );

    const taskId = data.task_id;
    if (!taskId) {
      // ACK anyway to prevent infinite retry
      return NextResponse.json({ ok: true });
    }

    const taskRef = db.collection("gen_tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      console.warn(`[PubSub webhook] Task ${taskId} not found in Firestore`);
      return NextResponse.json({ ok: true }); // ACK
    }

    const taskData = taskDoc.data()!;
    const bucket =
      process.env.FIREBASE_STORAGE_BUCKET || "flexme-now.firebasestorage.app";

    if (data.status === "done") {
      const outputPath =
        data.output_gcs_path || taskData.output_gcs_path;
      const imageUrl =
        data.image_url ||
        `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(outputPath)}?alt=media`;

      // Update Firestore task status
      await taskRef.update({
        status: "done",
        image_url: imageUrl,
        output_gcs_path: outputPath,
        finished_at: Date.now(),
        elapsed_seconds: data.elapsed_seconds || null,
      });

      // Update template/story coverImage in Firestore
      await updateItemCoverImage(taskData, outputPath);

    } else if (data.status === "error") {
      await taskRef.update({
        status: "error",
        error: data.error || "Unknown error",
        finished_at: Date.now(),
      });
    } else {
      // Intermediate status: loading, generating
      await taskRef.update({
        status: data.status,
        updated_at: Date.now(),
      });
    }

    console.log(
      `[PubSub webhook] Task ${taskId.slice(0, 8)} → ${data.status}`
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PubSub webhook] Error:", error);
    // Return 500 so Pub/Sub retries
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}

/**
 * After a successful generation, update the item's coverImage in Firestore.
 */
async function updateItemCoverImage(
  taskData: Record<string, unknown>,
  outputPath: string
) {
  try {
    const contentType = (taskData.content_type || taskData.type) as string;
    const contentId = taskData.content_id as string;
    const chapterIndex = (taskData.chapter_index as number) || 0;

    if (!contentType || !contentId) return;

    if (contentType === "template") {
      const template = await getTemplate(contentId);
      if (template) {
        await updateTemplate(contentId, { coverImage: outputPath });
        console.log(`[webhook] Updated template ${contentId} coverImage → ${outputPath}`);
      }
    } else if (contentType === "story") {
      const story = await getStory(contentId);
      if (story) {
        if (outputPath.includes("/ch")) {
          const previews = story.previewImages || [];
          while (previews.length <= chapterIndex) {
            previews.push("");
          }
          previews[chapterIndex] = outputPath;
          await updateStory(contentId, { previewImages: previews });
        } else {
          await updateStory(contentId, { coverImage: outputPath });
        }
        console.log(`[webhook] Updated story ${contentId} image → ${outputPath}`);
      }
    }
  } catch (err) {
    console.error("[webhook] Failed to update item coverImage:", err);
    // Don't throw — we still want to ACK the pub/sub message
  }
}
