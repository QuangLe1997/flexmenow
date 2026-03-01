import { Timestamp } from "firebase-admin/firestore";

export type GenerationStatus = "pending" | "processing" | "completed" | "failed";

export interface ImagenMetadata {
  model: string;
  seed: number | null;
  guidanceScale: number;
}

export interface Generation {
  userId: string;
  templateId: string;
  inputImageUrl: string;
  outputImageUrl: string | null;
  outputHdUrl: string | null;

  status: GenerationStatus;
  progress: number;
  errorMessage: string | null;

  promptUsed: string;
  generationTimeMs: number | null;
  creditsSpent: number;

  imagenMetadata: ImagenMetadata | null;

  createdAt: Timestamp;
  completedAt: Timestamp | null;
}

export interface GenFlexShotInput {
  inputImagePath: string;
  templateId: string;
  style?: string;
}

export interface GenFlexShotResult {
  generationId: string;
  status: GenerationStatus;
  creditsSpent: number;
  creditsRemaining: number;
}
