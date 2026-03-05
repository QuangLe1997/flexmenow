import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { verifyAdmin } from "@/lib/auth";
import {
  getTemplate,
  updateTemplate,
  getStory,
  updateStory,
} from "@/lib/firestore-store";

const LANGUAGES: Record<string, string> = {
  vi: "Vietnamese",
  es: "Spanish",
  pt: "Portuguese",
  ja: "Japanese",
  ko: "Korean",
};

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }
  return new GoogleGenAI({
    vertexai: true,
    project: "flexme-now",
    location: "us-central1",
  });
}

async function translateTexts(
  texts: Record<string, string>,
  targetLangs: string[]
): Promise<Record<string, string>> {
  const client = getClient();

  const langNames = targetLangs.map((l) => `${l} (${LANGUAGES[l]})`).join(", ");
  const prompt = `Translate the following texts to these languages: ${langNames}.

Input texts (JSON):
${JSON.stringify(texts, null, 2)}

Rules:
- Keep the same JSON keys
- For each key, add translations as "{key}__{lang}" (double underscore separator)
- Keep translations natural and concise, suitable for a mobile app UI
- Brand names (FlexMe, FlexLocket, FlexShot, FlexTale) must NEVER be translated
- Return ONLY valid JSON, no markdown fences, no explanation

Example input: {"title": "Golden Hour Portrait"}
Example output for vi, es: {"title__vi": "Chan dung Gio Vang", "title__es": "Retrato Hora Dorada"}`;

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text || "";
  const jsonStr = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(jsonStr);
}

interface BatchResult {
  id: string;
  status: "success" | "error" | "skipped";
  message?: string;
  langs?: string[];
}

/**
 * POST /api/translate/batch
 *
 * Body:
 *   - type: "template" | "story"
 *   - ids: string[]
 *   - langs?: string[] (default all 5)
 */
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, ids, langs } = body as {
      type: string;
      ids: string[];
      langs?: string[];
    };

    if (!type || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Missing type or ids array" },
        { status: 400 }
      );
    }

    if (ids.length > 50) {
      return NextResponse.json(
        { error: "Max 50 items per batch" },
        { status: 400 }
      );
    }

    const targetLangs = (langs || Object.keys(LANGUAGES)).filter(
      (l) => l in LANGUAGES
    );

    const results: BatchResult[] = [];

    // Process sequentially to avoid rate limits
    for (const id of ids) {
      try {
        if (type === "template") {
          const template = await getTemplate(id);
          if (!template) {
            results.push({ id, status: "error", message: "Not found" });
            continue;
          }

          const texts: Record<string, string> = {};
          if (template.name.en) texts.name = template.name.en;

          if (Object.keys(texts).length === 0) {
            results.push({ id, status: "skipped", message: "No EN text" });
            continue;
          }

          const translations = await translateTexts(texts, targetLangs);
          const updatedName = { ...template.name };
          for (const lang of targetLangs) {
            if (translations[`name__${lang}`]) {
              updatedName[lang] = translations[`name__${lang}`];
            }
          }
          await updateTemplate(id, { name: updatedName });
          results.push({ id, status: "success", langs: targetLangs });
        } else if (type === "story") {
          const story = await getStory(id);
          if (!story) {
            results.push({ id, status: "error", message: "Not found" });
            continue;
          }

          const texts: Record<string, string> = {};
          if (story.title.en) texts.title = story.title.en;
          if (story.description.en) texts.description = story.description.en;
          story.chapters.forEach((ch, i) => {
            if (ch.heading?.en) texts[`ch${i}_heading`] = ch.heading.en;
            if (ch.text?.en) texts[`ch${i}_text`] = ch.text.en;
          });

          if (Object.keys(texts).length === 0) {
            results.push({ id, status: "skipped", message: "No EN text" });
            continue;
          }

          const translations = await translateTexts(texts, targetLangs);
          const updatedTitle = { ...story.title };
          const updatedDescription = { ...story.description };
          const updatedChapters = story.chapters.map((ch, i) => {
            const updatedHeading = { ...ch.heading };
            const updatedText = { ...ch.text };
            for (const lang of targetLangs) {
              if (translations[`title__${lang}`]) updatedTitle[lang] = translations[`title__${lang}`];
              if (translations[`description__${lang}`]) updatedDescription[lang] = translations[`description__${lang}`];
              if (translations[`ch${i}_heading__${lang}`]) updatedHeading[lang] = translations[`ch${i}_heading__${lang}`];
              if (translations[`ch${i}_text__${lang}`]) updatedText[lang] = translations[`ch${i}_text__${lang}`];
            }
            return { ...ch, heading: updatedHeading, text: updatedText };
          });

          await updateStory(id, {
            title: updatedTitle,
            description: updatedDescription,
            chapters: updatedChapters,
          });
          results.push({ id, status: "success", langs: targetLangs });
        }
      } catch (err) {
        results.push({
          id,
          status: "error",
          message: err instanceof Error ? err.message : "Failed",
        });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status === "error").length;
    const skippedCount = results.filter((r) => r.status === "skipped").length;

    return NextResponse.json({
      total: ids.length,
      success: successCount,
      errors: errorCount,
      skipped: skippedCount,
      results,
    });
  } catch (error) {
    console.error("Batch translation failed:", error);
    const message = error instanceof Error ? error.message : "Batch translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
