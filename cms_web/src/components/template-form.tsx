"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplatePreview } from "./template-preview";
import type { TemplateItem, I18nString } from "@/lib/types";

const LANGUAGES = ["en", "vi", "es", "pt", "ja", "ko"] as const;
const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  vi: "Vietnamese",
  es: "Spanish",
  pt: "Portuguese",
  ja: "Japanese",
  ko: "Korean",
};

const BADGES = ["", "new", "hot", "HOT", "trending", "limited", "NEW"];
const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];
const MODELS = ["imagen-3.0-generate-001", "imagen-3.0-generate-002", "imagen-3.0-fast-generate-001"];

// Form data mirrors TemplateItem but without id/createdAt/updatedAt/stats
export interface TemplateFormData {
  slug: string;
  name: I18nString;
  category: string;
  type: string;
  gender: string;
  style: string;
  credits: number;
  badge: string;
  premium: boolean;
  isActive: boolean;
  sortOrder: number;
  coverImage: string;
  previewImages: string[];
  prompt: {
    base: string;
    negative: string;
    styleHint: string;
  };
  aiConfig: {
    model: string;
    guidanceScale: number;
    numInferenceSteps: number;
    aspectRatios: string[];
  };
  tags: string[];
}

const DEFAULT_DATA: TemplateFormData = {
  slug: "",
  name: { en: "" },
  category: "professional",
  type: "headshot",
  gender: "all",
  style: "",
  credits: 1,
  badge: "",
  premium: false,
  isActive: true,
  sortOrder: 0,
  coverImage: "",
  previewImages: [],
  prompt: { base: "", negative: "", styleHint: "" },
  aiConfig: {
    model: "imagen-3.0-generate-002",
    guidanceScale: 7.5,
    numInferenceSteps: 50,
    aspectRatios: ["1:1"],
  },
  tags: [],
};

function templateItemToFormData(item: TemplateItem): TemplateFormData {
  return {
    slug: item.slug,
    name: item.name,
    category: item.category,
    type: item.type,
    gender: item.gender,
    style: item.style,
    credits: item.credits,
    badge: item.badge || "",
    premium: item.premium,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    coverImage: item.coverImage,
    previewImages: [...item.previewImages],
    prompt: { ...item.prompt },
    aiConfig: {
      model: item.aiConfig.model,
      guidanceScale: item.aiConfig.guidanceScale,
      numInferenceSteps: item.aiConfig.numInferenceSteps,
      aspectRatios: [...item.aiConfig.aspectRatios],
    },
    tags: [...item.tags],
  };
}

interface Props {
  initialData?: TemplateItem;
  templateId?: string;
  readOnly?: boolean;
  version?: string;
}

export function TemplateForm({ initialData, templateId, readOnly, version }: Props) {
  const router = useRouter();
  const [data, setData] = useState<TemplateFormData>(
    initialData ? templateItemToFormData(initialData) : DEFAULT_DATA
  );
  const [activeLang, setActiveLang] = useState<string>("en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState("");

  function update<K extends keyof TemplateFormData>(key: K, value: TemplateFormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function updatePrompt(key: keyof TemplateFormData["prompt"], value: string) {
    setData((prev) => ({
      ...prev,
      prompt: { ...prev.prompt, [key]: value },
    }));
  }

  function updateAiConfig(key: keyof TemplateFormData["aiConfig"], value: unknown) {
    setData((prev) => ({
      ...prev,
      aiConfig: { ...prev.aiConfig, [key]: value },
    }));
  }

  function updateName(lang: string, value: string) {
    setData((prev) => ({
      ...prev,
      name: { ...prev.name, [lang]: value },
    }));
  }

  function toggleAspectRatio(ratio: string) {
    setData((prev) => {
      const current = prev.aiConfig.aspectRatios;
      const next = current.includes(ratio)
        ? current.filter((r) => r !== ratio)
        : [...current, ratio];
      return {
        ...prev,
        aiConfig: { ...prev.aiConfig, aspectRatios: next.length > 0 ? next : [ratio] },
      };
    });
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !data.tags.includes(tag)) {
      update("tags", [...data.tags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    update("tags", data.tags.filter((t) => t !== tag));
  }

  async function handleImageUpload(file: File, target: "cover" | number) {
    const ext = file.name.split(".").pop() || "webp";
    const id = templateId || "new";
    const gcsPath =
      target === "cover"
        ? `mockup-images/templates/${id}_cover.${ext}`
        : `mockup-images/templates/${id}_preview${target}.${ext}`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", gcsPath);

    if (target === "cover") setUploadingCover(true);
    else setUploadingPreview(target);

    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      // Store relative GCS path (not full URL)
      if (target === "cover") {
        update("coverImage", gcsPath);
      } else {
        const newPreviews = [...data.previewImages];
        newPreviews[target] = gcsPath;
        update("previewImages", newPreviews);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (target === "cover") setUploadingCover(false);
      else setUploadingPreview(null);
    }
  }

  function getImageUrl(relativePath: string): string {
    if (!relativePath) return "";
    if (relativePath.startsWith("http")) return relativePath;
    return `https://firebasestorage.googleapis.com/v0/b/flexme-now.firebasestorage.app/o/${encodeURIComponent(relativePath)}?alt=media`;
  }

  async function handleSave() {
    if (!data.name.en) {
      setError("English name is required");
      return;
    }
    if (!data.prompt.base) {
      setError("Base prompt is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("adminToken") || "";
      const vParam = version ? `?version=${version}` : "";
      const url = templateId ? `/api/templates/${templateId}${vParam}` : `/api/templates${vParam}`;
      const method = templateId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      router.push("/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Preview adapter — convert form data to what TemplatePreview expects
  const previewData = {
    ...data,
    coverUrl: getImageUrl(data.coverImage),
    isPremium: data.premium,
    previewUrls: data.previewImages.map(getImageUrl),
    aiConfig: {
      ...data.aiConfig,
      aspectRatio: data.aiConfig.aspectRatios[0] || "1:1",
    },
  };

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
      {/* Form */}
      <div className={`xl:col-span-2 space-y-6${readOnly ? " pointer-events-none opacity-70" : ""}`}>
        {readOnly && (
          <div className="pointer-events-auto rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
            This version is published/archived and read-only.
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Name (i18n tabs) */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Template Name
          </h3>
          <div className="mb-3 flex gap-1 border-b border-neutral-800">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  activeLang === lang
                    ? "border-b-2 border-brand text-brand"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <div>
            <label className="label">{LANGUAGE_LABELS[activeLang]}</label>
            <input
              type="text"
              value={data.name[activeLang] || ""}
              onChange={(e) => updateName(activeLang, e.target.value)}
              className="input"
              placeholder={`Template name in ${LANGUAGE_LABELS[activeLang]}`}
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Basic Information
          </h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div>
              <label className="label">Slug</label>
              <input
                type="text"
                value={data.slug}
                onChange={(e) => update("slug", e.target.value)}
                className="input"
                placeholder="auto_generated_from_name"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <input
                type="text"
                value={data.category}
                onChange={(e) => update("category", e.target.value)}
                className="input"
                placeholder="e.g., professional"
              />
            </div>
            <div>
              <label className="label">Type</label>
              <input
                type="text"
                value={data.type}
                onChange={(e) => update("type", e.target.value)}
                className="input"
                placeholder="e.g., headshot"
              />
            </div>
            <div>
              <label className="label">Gender</label>
              <input
                type="text"
                value={data.gender}
                onChange={(e) => update("gender", e.target.value)}
                className="input"
                placeholder="e.g., all"
              />
            </div>
            <div>
              <label className="label">Style</label>
              <input
                type="text"
                value={data.style}
                onChange={(e) => update("style", e.target.value)}
                className="input"
                placeholder="e.g., cinematic, anime"
              />
            </div>
            <div>
              <label className="label">Credits</label>
              <input
                type="number"
                value={data.credits}
                onChange={(e) => update("credits", parseInt(e.target.value) || 0)}
                className="input"
                min={0}
              />
            </div>
            <div>
              <label className="label">Badge</label>
              <select
                value={data.badge}
                onChange={(e) => update("badge", e.target.value)}
                className="select"
              >
                {BADGES.map((b) => (
                  <option key={b} value={b}>
                    {b ? b : "None"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Sort Order</label>
              <input
                type="number"
                value={data.sortOrder}
                onChange={(e) => update("sortOrder", parseInt(e.target.value) || 0)}
                className="input"
              />
            </div>
            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.premium}
                  onChange={(e) => update("premium", e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-600 bg-bg-elevated text-brand focus:ring-brand"
                />
                <span className="text-sm text-neutral-300">Premium</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.isActive}
                  onChange={(e) => update("isActive", e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-600 bg-bg-elevated text-brand focus:ring-brand"
                />
                <span className="text-sm text-neutral-300">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Tags
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-brand/60 hover:text-brand"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="input flex-1"
              placeholder="Add tag and press Enter"
            />
            <button onClick={addTag} className="btn-secondary text-sm">
              Add
            </button>
          </div>
        </div>

        {/* Images */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Images
          </h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Cover */}
            <div>
              <label className="label">Cover Image</label>
              <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-700 bg-bg-elevated transition-colors hover:border-neutral-600">
                {data.coverImage ? (
                  <img
                    src={getImageUrl(data.coverImage)}
                    alt="Cover"
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : uploadingCover ? (
                  <span className="text-xs text-neutral-400">Uploading...</span>
                ) : (
                  <>
                    <svg className="mb-1 h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs text-neutral-500">Cover</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "cover");
                  }}
                />
              </label>
              {data.coverImage && (
                <p className="mt-1 text-xs text-neutral-500 truncate" title={data.coverImage}>
                  {data.coverImage}
                </p>
              )}
            </div>

            {/* Previews */}
            {[0, 1, 2].map((idx) => (
              <div key={idx}>
                <label className="label">Preview {idx + 1}</label>
                <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-700 bg-bg-elevated transition-colors hover:border-neutral-600">
                  {data.previewImages[idx] ? (
                    <img
                      src={getImageUrl(data.previewImages[idx])}
                      alt={`Preview ${idx + 1}`}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : uploadingPreview === idx ? (
                    <span className="text-xs text-neutral-400">Uploading...</span>
                  ) : (
                    <>
                      <svg className="mb-1 h-6 w-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs text-neutral-500">Preview {idx + 1}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, idx);
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Prompt Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Base Prompt</label>
                <span className="text-xs text-neutral-500">
                  {data.prompt.base.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                value={data.prompt.base}
                onChange={(e) => updatePrompt("base", e.target.value)}
                className="input min-h-[120px] resize-y"
                placeholder="The main generation prompt. Use {face_description} for face embedding placeholder."
                rows={5}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Negative Prompt</label>
                <span className="text-xs text-neutral-500">
                  {data.prompt.negative.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                value={data.prompt.negative}
                onChange={(e) => updatePrompt("negative", e.target.value)}
                className="input min-h-[80px] resize-y"
                placeholder="What to avoid in generation..."
                rows={3}
              />
            </div>
            <div>
              <label className="label">Style Hint</label>
              <input
                type="text"
                value={data.prompt.styleHint}
                onChange={(e) => updatePrompt("styleHint", e.target.value)}
                className="input"
                placeholder="e.g., professional headshot, cinematic lighting"
              />
            </div>
          </div>
        </div>

        {/* AI Config */}
        <div className="card">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            AI Configuration
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Model</label>
              <select
                value={data.aiConfig.model}
                onChange={(e) => updateAiConfig("model", e.target.value)}
                className="select"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Guidance Scale</label>
              <input
                type="number"
                value={data.aiConfig.guidanceScale}
                onChange={(e) =>
                  updateAiConfig("guidanceScale", parseFloat(e.target.value) || 7.5)
                }
                className="input"
                min={1}
                max={20}
                step={0.5}
              />
            </div>
            <div>
              <label className="label">Inference Steps</label>
              <input
                type="number"
                value={data.aiConfig.numInferenceSteps}
                onChange={(e) =>
                  updateAiConfig("numInferenceSteps", parseInt(e.target.value) || 50)
                }
                className="input"
                min={1}
                max={100}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Aspect Ratios (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar}
                  onClick={() => toggleAspectRatio(ar)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    data.aiConfig.aspectRatios.includes(ar)
                      ? "bg-brand/20 text-brand border border-brand/40"
                      : "bg-bg-elevated text-neutral-400 border border-neutral-700 hover:border-neutral-600"
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving
                ? "Saving..."
                : templateId
                ? "Update Template"
                : "Create Template"}
            </button>
            <button
              onClick={() => router.push("/templates")}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="xl:col-span-1">
        <div className="sticky top-8">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Live Preview
          </h3>
          <TemplatePreview data={previewData} />
        </div>
      </div>
    </div>
  );
}
