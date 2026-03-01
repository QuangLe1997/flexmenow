import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY, GEMINI_MODEL } from "./constants";

let genAIClient: GoogleGenAI | null = null;

/**
 * Get the singleton Gemini GenAI client.
 * Uses the GEMINI_API_KEY from environment variables.
 */
export function getGenAIClient(): GoogleGenAI {
  if (!genAIClient) {
    if (!GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY is not set. Please configure it in environment variables."
      );
    }
    genAIClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return genAIClient;
}

/**
 * Get the model name for Gemini text generation.
 */
export function getGeminiModel(): string {
  return GEMINI_MODEL;
}
