import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { verifyAdmin } from "@/lib/auth";
import { uploadToGcs, downloadFromGcs } from "@/lib/gcs";
import { db } from "@/lib/firebase-admin";
import { PubSub } from "@google-cloud/pubsub";

const PROJECT_ID = "flexme-now";
const LOCATION = "us-central1";
const IMAGE_MODEL = "gemini-2.5-flash-preview-image-generation";
const RESULTS_TOPIC = process.env.PUBSUB_RESULTS_TOPIC || "image-gen-results";

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }
  return new GoogleGenAI({
    vertexai: true,
    project: PROJECT_ID,
    location: LOCATION,
  });
}

function getPubSub(): PubSub {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    const credentials = JSON.parse(serviceAccountJson);
    return new PubSub({ projectId: PROJECT_ID, credentials });
  }
  return new PubSub({ projectId: PROJECT_ID });
}

/**
 * GET /api/generate-gpu/simulate
 *
 * List pending/queued tasks that can be simulated.
 */
export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await db
      .collection("gen_tasks")
      .where("status", "in", ["queued", "loading"])
      .orderBy("created_at", "desc")
      .limit(20)
      .get();

    const tasks = snapshot.docs.map((doc) => ({
      task_id: doc.id,
      status: doc.data().status,
      type: doc.data().type,
      content_id: doc.data().content_id,
      model: doc.data().model,
      prompt: (doc.data().prompt || "").substring(0, 100),
      created_at: doc.data().created_at,
      input_gcs_path: doc.data().input_gcs_path,
      output_gcs_path: doc.data().output_gcs_path,
    }));

    return NextResponse.json({ tasks, count: tasks.length });
  } catch (error) {
    console.error("GET /api/generate-gpu/simulate failed:", error);
    return NextResponse.json({ error: "Failed to list tasks" }, { status: 500 });
  }
}

/**
 * POST /api/generate-gpu/simulate
 *
 * Simulate GPU processing for a specific task:
 * 1. Read task from Firestore
 * 2. Download input image from GCS (or create placeholder in mock mode)
 * 3. Generate image via Gemini (or use placeholder in mock mode)
 * 4. Upload result to GCS
 * 5. Publish "done" result to Pub/Sub (triggers webhook)
 *
 * Body: { task_id: string, mode?: "mock" | "gemini" }
 *   - mode=mock: skip Gemini, use placeholder image (default if no GEMINI_API_KEY)
 *   - mode=gemini: use Gemini for real generation
 */
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const body = await request.json();
    const { task_id, mode: requestedMode } = body;
    if (!task_id) {
      return NextResponse.json({ error: "Missing task_id" }, { status: 400 });
    }

    // Determine mode: mock (placeholder) or gemini (real)
    const hasGeminiKey = !!(process.env.GEMINI_API_KEY);
    const mode = requestedMode || (hasGeminiKey ? "gemini" : "mock");

    // 1. Read task from Firestore
    const taskDoc = await db.collection("gen_tasks").doc(task_id).get();
    if (!taskDoc.exists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = taskDoc.data()!;
    if (task.status === "done") {
      return NextResponse.json({ error: "Task already completed" }, { status: 400 });
    }

    // Update status to "generating"
    await db.collection("gen_tasks").doc(task_id).update({
      status: "generating",
      updated_at: Date.now(),
    });

    let webpBuffer: Buffer;

    if (mode === "gemini") {
      // Real Gemini generation
      const inputBuffer = await downloadFromGcs(task.input_gcs_path);
      const jpegBuffer = await sharp(inputBuffer)
        .resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
      const inputBase64 = jpegBuffer.toString("base64");

      const prompt = task.prompt || "";
      const negativePrompt = task.negative_prompt || "";
      const finalPrompt = negativePrompt
        ? `${prompt}\n\nAvoid: ${negativePrompt}`
        : prompt;

      const client = getClient();
      const response = await client.models.generateContent({
        model: IMAGE_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: inputBase64 } },
              {
                text: `Generate an image of this person in the following scene. Keep the person's face and identity exactly the same.\n\n${finalPrompt}`,
              },
            ],
          },
        ],
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            aspectRatio: "1:1" as any,
          },
        },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error("No candidates returned — may have been filtered by safety.");
      }

      let imageBuffer: Buffer | null = null;
      const parts = candidates[0].content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
            imageBuffer = Buffer.from(part.inlineData.data, "base64");
            break;
          }
        }
      }

      if (!imageBuffer) {
        throw new Error("No image data in response.");
      }

      webpBuffer = await sharp(imageBuffer)
        .webp({ quality: 85 })
        .toBuffer();
    } else {
      // Mock mode: create a 256x256 gradient placeholder image
      const svgPlaceholder = `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#F59E0B"/>
            <stop offset="100%" style="stop-color:#8B5CF6"/>
          </linearGradient>
        </defs>
        <rect width="256" height="256" fill="url(#g)"/>
        <text x="128" y="120" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">MOCK</text>
        <text x="128" y="145" text-anchor="middle" fill="white" font-size="12" font-family="sans-serif">${task_id.slice(0, 8)}</text>
      </svg>`;

      webpBuffer = await sharp(Buffer.from(svgPlaceholder))
        .webp({ quality: 85 })
        .toBuffer();
    }

    // 4. Upload to GCS
    const outputPath = task.output_gcs_path;
    await uploadToGcs(webpBuffer, outputPath, "image/webp");

    const bucket = process.env.FIREBASE_STORAGE_BUCKET || "flexme-now.firebasestorage.app";
    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(outputPath)}?alt=media`;

    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

    // 5. Publish result to Pub/Sub (triggers webhook)
    const resultMessage = {
      task_id,
      status: "done",
      output_gcs_path: outputPath,
      image_url: imageUrl,
      model: mode === "gemini" ? "gemini-simulate" : "mock-simulate",
      elapsed_seconds: elapsedSeconds,
      finished_at: Date.now(),
      metadata: task.metadata || {},
    };

    const pubsub = getPubSub();
    const topic = pubsub.topic(RESULTS_TOPIC);
    const messageId = await topic.publishMessage({
      json: resultMessage,
      attributes: {
        task_id,
        status: "done",
      },
    });

    console.log(
      `[Simulate] Task ${task_id.slice(0, 8)} done in ${elapsedSeconds}s (${mode}), published msg=${messageId}`
    );

    return NextResponse.json({
      ok: true,
      task_id,
      status: "done",
      mode,
      image_url: imageUrl,
      output_gcs_path: outputPath,
      elapsed_seconds: elapsedSeconds,
      pubsub_message_id: messageId,
    });
  } catch (error) {
    console.error("GPU simulate failed:", error);

    // Try to update task status to error
    try {
      const { task_id } = await request.clone().json();
      if (task_id) {
        await db.collection("gen_tasks").doc(task_id).update({
          status: "error",
          error: error instanceof Error ? error.message : "Simulation failed",
          finished_at: Date.now(),
        });
      }
    } catch {
      // ignore
    }

    const message = error instanceof Error ? error.message : "Simulation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
