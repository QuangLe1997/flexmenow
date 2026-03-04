// Shared TypeScript interfaces matching exact GCS JSON schema

export interface I18nString {
  en: string;
  vi?: string;
  es?: string;
  pt?: string;
  ja?: string;
  ko?: string;
  [key: string]: string | undefined;
}

export interface FilterOption {
  id: string;
  name: I18nString;
}

// ── Templates ──

export interface TemplatePrompt {
  base: string;
  negative: string;
  styleHint: string;
}

export interface TemplateAiConfig {
  model: string;
  guidanceScale: number;
  numInferenceSteps: number;
  aspectRatios: string[];
}

export interface TemplateStats {
  likes: number;
  views: number;
  generates: number;
}

export interface TemplateItem {
  id: string;
  slug: string;
  name: I18nString;
  category: string;
  type: string;
  gender: string;
  style: string;
  credits: number;
  badge: string | null;
  premium: boolean;
  isActive: boolean;
  sortOrder: number;
  coverImage: string;
  previewImages: string[];
  prompt: TemplatePrompt;
  aiConfig: TemplateAiConfig;
  stats: TemplateStats;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplatesJson {
  version: string;
  updatedAt: string;
  imageBaseUrl: string;
  imageSuffix: string;
  defaults: {
    creditsPerTemplate: number;
    premiumCreditsPerTemplate: number;
  };
  categories: FilterOption[];
  types: FilterOption[];
  genders: FilterOption[];
  templates: TemplateItem[];
}

// ── Stories ──

export interface ChapterAiConfig {
  model: string;
  guidanceScale: number;
  aspectRatio: string;
  referenceType: string;
}

export interface ChapterItem {
  order: number;
  heading: I18nString;
  text: I18nString;
  choices: Record<string, string[]>;
  prompt: TemplatePrompt;
  aiConfig: ChapterAiConfig;
}

export interface StoryItem {
  id: string;
  slug: string;
  title: I18nString;
  description: I18nString;
  category: string;
  type: string;
  gender: string;
  duration: string;
  totalPics: number;
  credits: number;
  badge: string | null;
  premium: boolean;
  isActive: boolean;
  sortOrder: number;
  coverImage: string;
  previewImages: string[];
  chapters: ChapterItem[];
  tags: string[];
  stats: TemplateStats;
  createdAt: string;
  updatedAt: string;
}

export interface StoriesJson {
  version: string;
  updatedAt: string;
  imageBaseUrl: string;
  imageSuffix: string;
  categories: FilterOption[];
  types: FilterOption[];
  genders: FilterOption[];
  durations: FilterOption[];
  stories: StoryItem[];
}

// ── Versioning ──

export type VersionStatus = "published" | "review" | "archived";

export interface VersionInfo {
  version: string;
  status: VersionStatus;
  created_at: string;
  published_at?: string;
  item_count: number;
  active_count: number;
  note: string;
}

export interface VersionManifest {
  published: string;
  versions: VersionInfo[];
}

export type ContentType = "templates" | "stories";
