import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { verifyAdmin } from "@/lib/auth";
import { uploadToGcs } from "@/lib/gcs";
import {
  getTemplate,
  updateTemplate,
  getStory,
  updateStory,
} from "@/lib/firestore-store";

const PROJECT_ID = "flexme-now";
const LOCATION = "us-central1";
const IMAGE_MODEL = "gemini-2.5-flash-preview-image-generation";

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

async function generateImage(
  prompt: string,
  inputBase64: string,
  aspectRatio: string,
  negativePrompt?: string
): Promise<Buffer> {
  const client = getClient();
  const finalPrompt = negativePrompt
    ? `${prompt}\n\nAvoid: ${negativePrompt}`
    : prompt;

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
        aspectRatio: aspectRatio as any,
      },
    },
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No candidates returned — may have been filtered by safety.");
  }

  const parts = candidates[0].content?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, "base64");
      }
    }
  }

  throw new Error("No image data in response.");
}

/**
 * POST /api/test-generate
 *
 * Body (FormData):
 *   - inputImage: File (face photo)
 *   - type: "template" | "story"
 *   - id: template or story ID
 *   - chapterIndex?: number (for stories, which chapter to test)
 *
 * Returns: { url, path } — the generated image saved as preview
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

    if (!inputImage || !type || !id) {
      return NextResponse.json(
        { error: "Missing inputImage, type, or id" },
        { status: 400 }
      );
    }

    // Convert input image to base64
    const rawBuffer = Buffer.from(await inputImage.arrayBuffer());
    const jpegBuffer = await sharp(rawBuffer)
      .resize({ width: 768, height: 768, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    const inputBase64 = jpegBuffer.toString("base64");

    let prompt: string;
    let negative: string;
    let aspectRatio: string;
    let outputPath: string;

    if (type === "template") {
      const template = await getTemplate(id);
      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }

      prompt = template.prompt.base;
      negative = template.prompt.negative;
      aspectRatio = template.aiConfig.aspectRatios?.[0] || "1:1";
      outputPath = `mockup-images/templates/${id}_cover.webp`;
    } else if (type === "story") {
      const story = await getStory(id);
      if (!story) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      const chapter = story.chapters[chapterIndex];
      if (!chapter) {
        return NextResponse.json({ error: `Chapter ${chapterIndex} not found` }, { status: 404 });
      }

      prompt = chapter.prompt.base;
      negative = chapter.prompt.negative;
      aspectRatio = chapter.aiConfig?.aspectRatio || "9:16";
      outputPath = `mockup-images/stories/${id}/ch${chapterIndex + 1}.webp`;
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Replace {subject} placeholder
    prompt = prompt.replace(/\{subject\}/g, "the person");
    prompt = prompt.replace(/\{face_description\}/g, "the person");

    // Generate image
    const imageBuffer = await generateImage(prompt, inputBase64, aspectRatio, negative);

    // Convert to WebP and upload
    const webpBuffer = await sharp(imageBuffer)
      .webp({ quality: 85 })
      .toBuffer();

    const url = await uploadToGcs(webpBuffer, outputPath, "image/webp");

    // Update template/story coverImage in Firestore
    await updateItemCoverImage(type, id, chapterIndex, outputPath);

    return NextResponse.json({
      url,
      path: outputPath,
      prompt: prompt.substring(0, 200) + "...",
    });
  } catch (error) {
    console.error("Test generate failed:", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function updateItemCoverImage(
  type: string,
  id: string,
  chapterIndex: number,
  outputPath: string
) {
  try {
    if (type === "template") {
      await updateTemplate(id, { coverImage: outputPath });
    } else if (type === "story") {
      const story = await getStory(id);
      if (story) {
        if (outputPath.includes("/ch")) {
          const previews = story.previewImages || [];
          while (previews.length <= chapterIndex) {
            previews.push("");
          }
          previews[chapterIndex] = outputPath;
          await updateStory(id, { previewImages: previews });
        } else {
          await updateStory(id, { coverImage: outputPath });
        }
      }
    }
  } catch (err) {
    console.error("Failed to update item coverImage:", err);
  }
}
