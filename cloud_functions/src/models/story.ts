import { Timestamp } from "firebase-admin/firestore";

export type StoryStatus = "pending" | "processing" | "completed" | "failed";

export interface Story {
  userId: string;
  storyPackId: string;
  storyPackName: string;
  inputImageUrl: string;

  status: StoryStatus;
  totalScenes: number;
  completedScenes: number;
  creditsSpent: number;

  createdAt: Timestamp;
  completedAt: Timestamp | null;
}

export interface StoryScene {
  sceneOrder: number;
  sceneName: string;
  status: StoryStatus;
  outputImageUrl: string | null;
  promptUsed: string | null;
  generationTimeMs: number | null;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
}

export interface StoryPack {
  name: string;
  description: string;
  category: "travel" | "love" | "lifestyle" | "fitness";
  previewUrls: string[];
  totalScenes: number;
  creditsCost: number;
  isPremium: boolean;
  isActive: boolean;
  sortOrder: number;
  usageCount: number;
  createdAt: Timestamp;
}

export interface StoryPackScene {
  sceneOrder: number;
  sceneName: string;
  promptTemplate: string;
  negativePrompt: string;
  styleHint: string;
  imagenParams: {
    guidanceScale: number;
    aspectRatio: string;
  };
}

export interface GenFlexTaleInput {
  inputImagePath: string;
  storyId: string;
  selectedChapters?: number[];
}

export interface GenFlexTaleResult {
  storyId: string;
  status: StoryStatus;
  totalScenes: number;
  creditsSpent: number;
  creditsRemaining: number;
}
