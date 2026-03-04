import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEYS, GEMINI_IMAGE_MODEL, GEMINI_MODEL, PROJECT_ID, VERTEX_AI_LOCATION } from "./constants";

// Cache clients per API key to reuse connections
const clientCache = new Map<string, GoogleGenAI>();

// Vertex AI fallback client (singleton — no API key needed)
let vertexClient: GoogleGenAI | null = null;

/**
 * Get a Gemini GenAI client.
 *
 * If GEMINI_API_KEYS pool is configured, picks a random key each call
 * to distribute load and avoid per-key rate limits.
 * Otherwise, falls back to Vertex AI auth (service account / ADC).
 */
export function getGenAIClient(): GoogleGenAI {
  if (GEMINI_API_KEYS.length > 0) {
    const key = GEMINI_API_KEYS[Math.floor(Math.random() * GEMINI_API_KEYS.length)];
    let client = clientCache.get(key);
    if (!client) {
      client = new GoogleGenAI({ apiKey: key });
      clientCache.set(key, client);
    }
    return client;
  }

  // Fallback: Vertex AI auth (works on Cloud Functions with default SA)
  if (!vertexClient) {
    vertexClient = new GoogleGenAI({
      vertexai: true,
      project: PROJECT_ID,
      location: VERTEX_AI_LOCATION,
    });
  }
  return vertexClient;
}

/**
 * Get the model name for Gemini text generation.
 */
export function getGeminiModel(): string {
  return GEMINI_MODEL;
}

/**
 * Get the model name for Gemini native image generation (FlexShot + FlexTale + FlexLocket).
 */
export function getGeminiImageModel(): string {
  return GEMINI_IMAGE_MODEL;
}
