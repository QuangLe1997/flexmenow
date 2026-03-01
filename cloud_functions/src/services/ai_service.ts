import { getGenAIClient, getGeminiModel } from "../config/ai";
import {
  IMAGEN_MODEL,
  PROJECT_ID,
  VERTEX_AI_LOCATION,
} from "../config/constants";
import { logger } from "../utils/logger";
import { throwInternal } from "../utils/errors";

const LOG_CTX = { functionName: "ai_service" };

export interface ImagenConfig {
  guidanceScale?: number;
  numberOfImages?: number;
  aspectRatio?: string;
  safetyFilterLevel?: string;
  negativePrompt?: string;
}

/**
 * Use Gemini to optimize a base prompt for Imagen image generation.
 *
 * Takes the raw template prompt and optional style hints, and returns
 * a detailed, optimized prompt that will produce better Imagen results.
 */
export async function optimizePrompt(
  basePrompt: string,
  styleHint: string,
  context?: string
): Promise<string> {
  const client = getGenAIClient();
  const model = getGeminiModel();

  const systemInstruction = [
    "You are an expert prompt engineer for AI image generation (Imagen 3).",
    "Given a base prompt, style hint, and optional context, produce an optimized prompt.",
    "The optimized prompt should:",
    "- Be vivid and descriptive (lighting, camera angle, mood, setting details)",
    "- Maintain the original subject/scene intent",
    "- Include photographic quality descriptors when style is realistic",
    "- Be a single paragraph, under 500 characters",
    "- Output ONLY the prompt text, no quotes, no explanation",
  ].join("\n");

  const userMessage = [
    `Base prompt: ${basePrompt}`,
    `Style: ${styleHint || "realistic"}`,
    context ? `Context: ${context}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await client.models.generateContent({
      model,
      contents: userMessage,
      config: {
        systemInstruction,
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    });

    const optimized = response.text?.trim();
    if (!optimized) {
      logger.warn("Gemini returned empty response, falling back to base prompt", LOG_CTX);
      return basePrompt;
    }

    logger.debug(`Prompt optimized: ${optimized.substring(0, 100)}...`, LOG_CTX);
    return optimized;
  } catch (error) {
    logger.error("Gemini prompt optimization failed", error, LOG_CTX);
    // Fall back to the original prompt instead of failing the whole generation
    return basePrompt;
  }
}

/**
 * Generate an image using Vertex AI Imagen API.
 *
 * Calls the Imagen 3 REST endpoint via the Google Cloud API.
 * The service account must have Vertex AI User role.
 *
 * @returns Base64-encoded image buffer.
 */
export async function generateImage(
  prompt: string,
  referenceImageBase64: string,
  config: ImagenConfig = {}
): Promise<Buffer> {
  const {
    guidanceScale = 7.5,
    numberOfImages = 1,
    aspectRatio = "1:1",
    safetyFilterLevel = "BLOCK_MEDIUM_AND_ABOVE",
    negativePrompt,
  } = config;

  const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/${IMAGEN_MODEL}:predict`;

  // Build the request payload for Imagen 3 with subject reference
  const instances: Record<string, unknown>[] = [
    {
      prompt,
      ...(negativePrompt && { negativePrompt }),
      referenceImages: [
        {
          referenceImage: {
            bytesBase64Encoded: referenceImageBase64,
          },
          referenceType: "SUBJECT_REFERENCE",
        },
      ],
    },
  ];

  const parameters = {
    sampleCount: numberOfImages,
    aspectRatio,
    safetyFilterLevel,
    guidanceScale,
  };

  try {
    // Use Google Auth Library to get access token (auto-resolved in Cloud Functions)
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ instances, parameters }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error("Imagen API error", new Error(errorBody), LOG_CTX);
      throwInternal(`Image generation failed: ${response.status}`);
    }

    const result = await response.json() as {
      predictions: Array<{ bytesBase64Encoded: string }>;
    };

    if (!result.predictions || result.predictions.length === 0) {
      throwInternal("Imagen API returned no predictions.");
    }

    return Buffer.from(result.predictions[0].bytesBase64Encoded, "base64");
  } catch (error) {
    if (error instanceof Error && error.message.includes("Image generation failed")) {
      throw error;
    }
    logger.error("Image generation unexpected error", error, LOG_CTX);
    throwInternal("Image generation failed unexpectedly.");
  }
}

/**
 * Generate an image with face/subject consistency for FlexTale story scenes.
 *
 * Uses the same reference image for every scene to maintain subject identity.
 * Can optionally use a style reference from a previous scene for visual continuity.
 */
export async function generateImageWithConsistency(
  prompt: string,
  referenceImageBase64: string,
  previousSceneImageBase64: string | null,
  config: ImagenConfig = {}
): Promise<Buffer> {
  const {
    guidanceScale = 8.0,
    numberOfImages = 1,
    aspectRatio = "9:16",
    safetyFilterLevel = "BLOCK_MEDIUM_AND_ABOVE",
    negativePrompt,
  } = config;

  const endpoint = `https://${VERTEX_AI_LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${VERTEX_AI_LOCATION}/publishers/google/models/${IMAGEN_MODEL}:predict`;

  // Build reference images array -- always include the subject reference
  const referenceImages: Record<string, unknown>[] = [
    {
      referenceImage: {
        bytesBase64Encoded: referenceImageBase64,
      },
      referenceType: "SUBJECT_REFERENCE",
    },
  ];

  // If we have a previous scene image, include it as a style reference
  // This helps maintain visual consistency across story scenes
  if (previousSceneImageBase64) {
    referenceImages.push({
      referenceImage: {
        bytesBase64Encoded: previousSceneImageBase64,
      },
      referenceType: "STYLE_REFERENCE",
    });
  }

  const instances = [
    {
      prompt,
      ...(negativePrompt && { negativePrompt }),
      referenceImages,
    },
  ];

  const parameters = {
    sampleCount: numberOfImages,
    aspectRatio,
    safetyFilterLevel,
    guidanceScale,
  };

  try {
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ instances, parameters }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error("Imagen consistency API error", new Error(errorBody), LOG_CTX);
      throwInternal(`Image generation (consistency) failed: ${response.status}`);
    }

    const result = await response.json() as {
      predictions: Array<{ bytesBase64Encoded: string }>;
    };

    if (!result.predictions || result.predictions.length === 0) {
      throwInternal("Imagen API returned no predictions for consistency generation.");
    }

    return Buffer.from(result.predictions[0].bytesBase64Encoded, "base64");
  } catch (error) {
    if (error instanceof Error && error.message.includes("generation")) {
      throw error;
    }
    logger.error("Consistency image generation unexpected error", error, LOG_CTX);
    throwInternal("Consistency image generation failed unexpectedly.");
  }
}
