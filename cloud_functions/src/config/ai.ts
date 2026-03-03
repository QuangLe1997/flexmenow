import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY, GEMINI_IMAGE_MODEL, GEMINI_MODEL, PROJECT_ID, VERTEX_AI_LOCATION } from "./constants";

let genAIClient: GoogleGenAI | null = null;

/**
 * Get the singleton Gemini GenAI client.
 * If GEMINI_API_KEY is set, uses API key auth (AI Studio).
 * Otherwise, uses Vertex AI auth (service account / ADC) — works automatically on Cloud Functions.
 */
export function getGenAIClient(): GoogleGenAI {
  if (!genAIClient) {
    if (GEMINI_API_KEY) {
      genAIClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    } else {
      genAIClient = new GoogleGenAI({
        vertexai: true,
        project: PROJECT_ID,
        location: VERTEX_AI_LOCATION,
      });
    }
  }
  return genAIClient;
}

/**
 * Get the model name for Gemini text generation.
 */
export function getGeminiModel(): string {
  return GEMINI_MODEL;
}

/**
 * Get the model name for Gemini native image generation (FlexShot + FlexTale).
 */
export function getGeminiImageModel(): string {
  return GEMINI_IMAGE_MODEL;
}
