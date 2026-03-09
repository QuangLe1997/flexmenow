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
Example output for vi, es: {"title__vi": "Chân dung Giờ Vàng", "title__es": "Retrato Hora Dorada"}`;

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text || "";
  // Parse JSON from response (strip markdown fences if present)
  const jsonStr = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(jsonStr);
}

/**
 * POST /api/translate
 *
 * Body JSON:
 *   - type: "template" | "story"
 *   - id: item ID
 *   - langs?: string[] (target languages, default all 5)
 *
 * Translates all i18n fields from EN to target languages using Gemini.
 */
export async function POST(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, id, langs } = body as {
      type: string;
      id: string;
      langs?: string[];
    };

    if (!type || !id) {
      return NextResponse.json(
        { error: "Missing type or id" },
        { status: 400 }
      );
    }

    const targetLangs = (langs || Object.keys(LANGUAGES)).filter(
      (l) => l in LANGUAGES
    );
    if (targetLangs.length === 0) {
      return NextResponse.json(
        { error: "No valid target languages" },
        { status: 400 }
      );
    }

    if (type === "template") {
      const template = await getTemplate(id);
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      // Collect EN texts to translate
      const texts: Record<string, string> = {};
      if (template.name.en) texts.name = template.name.en;

      if (Object.keys(texts).length === 0) {
        return NextResponse.json({ translated: 0, message: "No EN text to translate" });
      }

      const translations = await translateTexts(texts, targetLangs);

      // Apply translations
      const updatedName = { ...template.name };
      for (const lang of targetLangs) {
        if (translations[`name__${lang}`]) {
          updatedName[lang] = translations[`name__${lang}`];
        }
      }

      await updateTemplate(id, { name: updatedName });

      return NextResponse.json({
        translated: targetLangs.length,
        langs: targetLangs,
        name: updatedName,
      });
    } else if (type === "story") {
      const story = await getStory(id);
      if (!story) {
        return NextResponse.json(
          { error: "Story not found" },
          { status: 404 }
        );
      }

      // Collect EN texts: title, description, and all chapter headings/texts
      const texts: Record<string, string> = {};
      if (story.title.en) texts.title = story.title.en;
      if (story.description.en) texts.description = story.description.en;

      story.chapters.forEach((ch, i) => {
        if (ch.heading?.en) texts[`ch${i}_heading`] = ch.heading.en;
        if (ch.text?.en) texts[`ch${i}_text`] = ch.text.en;
      });

      if (Object.keys(texts).length === 0) {
        return NextResponse.json({ translated: 0, message: "No EN text to translate" });
      }

      const translations = await translateTexts(texts, targetLangs);

      // Apply translations
      const updatedTitle = { ...story.title };
      const updatedDescription = { ...story.description };
      const updatedChapters = story.chapters.map((ch, i) => {
        const updatedHeading = { ...ch.heading };
        const updatedText = { ...ch.text };

        for (const lang of targetLangs) {
          if (translations[`title__${lang}`]) {
            updatedTitle[lang] = translations[`title__${lang}`];
          }
          if (translations[`description__${lang}`]) {
            updatedDescription[lang] = translations[`description__${lang}`];
          }
          if (translations[`ch${i}_heading__${lang}`]) {
            updatedHeading[lang] = translations[`ch${i}_heading__${lang}`];
          }
          if (translations[`ch${i}_text__${lang}`]) {
            updatedText[lang] = translations[`ch${i}_text__${lang}`];
          }
        }

        return { ...ch, heading: updatedHeading, text: updatedText };
      });

      await updateStory(id, {
        title: updatedTitle,
        description: updatedDescription,
        chapters: updatedChapters,
      });

      return NextResponse.json({
        translated: targetLangs.length,
        langs: targetLangs,
        fields: Object.keys(texts).length,
        title: updatedTitle,
      });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Translation failed:", error);
    const message =
      error instanceof Error ? error.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
