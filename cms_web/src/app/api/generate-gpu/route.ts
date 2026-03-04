import { NextResponse } from "next/server";
import sharp from "sharp";
import { verifyAdmin } from "@/lib/auth";
import { uploadToGcs } from "@/lib/gcs";
import {
  publishGenTask,
  type GenTaskMessage,
  type TaskMetadata,
} from "@/lib/pubsub";
import { buildTemplatesJson, buildStoriesJson, getVersionJson } from "@/lib/firestore-store";
import type { TemplatesJson, StoriesJson } from "@/lib/types";
import { db } from "@/lib/firebase-admin";

/**
 * POST /api/generate-gpu
 *
 * Submit an image generation task to the GPU service via Pub/Sub.
 * The input image is uploaded to GCS and the task is published to
 * the `image-gen-tasks` topic. The GPU service processes it and
 * publishes the result to `image-gen-results`.
 *
 * Body (FormData):
 *   - inputImage: File (face photo)
 *   - type: "template" | "story"
 *   - id: template or story ID
 *   - chapterIndex?: number (for stories)
 *   - model?: string (default: "zimage")
 *
 * Returns: { ok, task_id, message_id, status }
 */
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const inputImage = formData.get("inputImage") as File | null;
    const type = formData.get("type") as string;
    const id = formData.get("id") as string;
    const chapterIndex = parseInt(formData.get("chapterIndex") as string) || 0;
    const model = (formData.get("model") as string) || "zimage";
    const versionParam = formData.get("version") as string | null;

    if (!inputImage || !type || !id) {
      return NextResponse.json(
        { error: "Missing inputImage, type, or id" },
        { status: 400 }
      );
    }

    const taskId = crypto.randomUUID();

    // Upload input image to GCS
    const rawBuffer = Buffer.from(await inputImage.arrayBuffer());
    const jpegBuffer = await sharp(rawBuffer)
      .resize({
        width: 768,
        height: 768,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    const inputGcsPath = `gen-tasks/${taskId}/input.jpg`;
    await uploadToGcs(jpegBuffer, inputGcsPath, "image/jpeg");

    // Resolve prompt, output path, and metadata from template/story
    let prompt: string;
    let negative: string;
    let outputPath: string;
    let slug = "";
    let category = "";
    let tags: string[] = [];
    let version = "";

    if (type === "template") {
      const json = versionParam
        ? await getVersionJson<TemplatesJson>("templates", versionParam)
        : await buildTemplatesJson();
      const template = json.templates.find((t) => t.id === id);
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
      prompt = template.prompt.base
        .replace(/\{subject\}/g, "the person")
        .replace(/\{face_description\}/g, "the person");
      negative = template.prompt.negative;
      outputPath = `mockup-images/templates/${id}_cover.webp`;
      slug = template.slug;
      category = template.category;
      tags = template.tags || [];
      version = json.version;
    } else if (type === "story") {
      const json = versionParam
        ? await getVersionJson<StoriesJson>("stories", versionParam)
        : await buildStoriesJson();
      const story = json.stories.find((s) => s.id === id);
      if (!story) {
        return NextResponse.json(
          { error: "Story not found" },
          { status: 404 }
        );
      }
      const chapter = story.chapters[chapterIndex];
      if (!chapter) {
        return NextResponse.json(
          { error: `Chapter ${chapterIndex} not found` },
          { status: 404 }
        );
      }
      prompt = chapter.prompt.base
        .replace(/\{subject\}/g, "the person")
        .replace(/\{face_description\}/g, "the person");
      negative = chapter.prompt.negative;
      outputPath = `mockup-images/stories/${id}/ch${chapterIndex + 1}.webp`;
      slug = story.slug;
      category = story.category;
      tags = story.tags || [];
      version = json.version;
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Build full metadata for service-side tracking & querying
    const metadata: TaskMetadata = {
      source: "cms",
      ...(type === "template" ? { template_id: id } : {}),
      ...(type === "story" ? { story_id: id } : {}),
      chapter_index: chapterIndex,
      content_type: type as "template" | "story",
      slug,
      version,
      tags,
      category,
      created_by: admin.uid,
      output_gcs_path: outputPath,
      input_gcs_path: inputGcsPath,
    };

    // Publish task to Pub/Sub with full metadata
    const taskMessage: GenTaskMessage = {
      task_id: taskId,
      type: type as "template" | "story",
      content_id: id,
      chapter_index: chapterIndex,
      model,
      prompt,
      negative_prompt: negative,
      width: 1024,
      height: 1024,
      seed: -1,
      input_gcs_path: inputGcsPath,
      output_gcs_path: outputPath,
      slug,
      version,
      tags,
      category,
      created_by: admin.uid,
      metadata,
    };

    const messageId = await publishGenTask(taskMessage);

    // Save task to Firestore for status tracking (strip undefined values)
    const firestoreDoc = JSON.parse(JSON.stringify({
      ...taskMessage,
      status: "queued",
      pubsub_message_id: messageId,
      created_at: Date.now(),
      created_by: admin.uid,
    }));
    await db.collection("gen_tasks").doc(taskId).set(firestoreDoc);

    return NextResponse.json({
      ok: true,
      task_id: taskId,
      message_id: messageId,
      status: "queued",
    });
  } catch (error) {
    console.error("GPU generate task failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
