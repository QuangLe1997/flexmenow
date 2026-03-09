"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChapterEditor } from "./chapter-editor";
import { TestGenerate } from "./test-generate";
import type { StoryItem, ChapterItem, I18nString } from "@/lib/types";

const LANGUAGES = ["en", "vi", "es", "pt", "ja", "ko"] as const;
const LANGUAGE_LABELS: Record<string, string> = {
  en: "English", vi: "Vietnamese", es: "Spanish",
  pt: "Portuguese", ja: "Japanese", ko: "Korean",
};

const BADGES = ["", "new", "hot", "HOT", "trending", "limited"];
const DURATIONS = ["once", "daily", "weekly"];

interface StoryFormData {
  slug: string;
  title: I18nString;
  description: I18nString;
  category: string;
  type: string;
  gender: string;
  duration: string;
  credits: number;
  badge: string;
  premium: boolean;
  isActive: boolean;
  sortOrder: number;
  coverImage: string;
  previewImages: string[];
  chapters: ChapterItem[];
  tags: string[];
}

const DEFAULT_DATA: StoryFormData = {
  slug: "",
  title: { en: "" },
  description: { en: "" },
  category: "adventure",
  type: "story",
  gender: "all",
  duration: "once",
  credits: 5,
  badge: "",
  premium: false,
  isActive: true,
  sortOrder: 0,
  coverImage: "",
  previewImages: [],
  chapters: [],
  tags: [],
};

const DEFAULT_CHAPTER: ChapterItem = {
  order: 1,
  heading: { en: "" },
  text: { en: "" },
  choices: {},
  prompt: { base: "", negative: "", styleHint: "" },
  aiConfig: {
    model: "imagen-3.0-generate-001",
    guidanceScale: 8,
    aspectRatio: "9:16",
    referenceType: "subject",
  },
};

function storyItemToFormData(item: StoryItem): StoryFormData {
  return {
    slug: item.slug,
    title: { ...item.title },
    description: { ...item.description },
    category: item.category,
    type: item.type,
    gender: item.gender,
    duration: item.duration,
    credits: item.credits,
    badge: item.badge || "",
    premium: item.premium,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    coverImage: item.coverImage,
    previewImages: [...item.previewImages],
    chapters: item.chapters.map((ch) => ({ ...ch })),
    tags: [...item.tags],
  };
}

interface Props {
  initialData?: StoryItem;
  storyId?: string;
  readOnly?: boolean;
  version?: string;
}

export function StoryForm({ initialData, storyId, readOnly, version }: Props) {
  const router = useRouter();
  const [data, setData] = useState<StoryFormData>(
    initialData ? storyItemToFormData(initialData) : DEFAULT_DATA
  );
  const [activeLang, setActiveLang] = useState<string>("en");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translateMsg, setTranslateMsg] = useState("");

  async function handleTranslate() {
    if (!storyId) {
      setError("Save the story first before translating");
      return;
    }
    if (!data.title.en) {
      setError("English title is required for translation");
      return;
    }
    setTranslating(true);
    setTranslateMsg("");
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: "story", id: storyId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      // Reload the story to get updated translations
      const storyRes = await fetch(`/api/stories/${storyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (storyRes.ok) {
        const updated = await storyRes.json();
        setData({
          slug: updated.slug,
          title: updated.title,
          description: updated.description,
          category: updated.category,
          type: updated.type,
          gender: updated.gender,
          duration: updated.duration,
          credits: updated.credits,
          badge: updated.badge || "",
          premium: updated.premium,
          isActive: updated.isActive,
          sortOrder: updated.sortOrder,
          coverImage: updated.coverImage,
          previewImages: updated.previewImages || [],
          chapters: updated.chapters || [],
          tags: updated.tags || [],
        });
      }
      setTranslateMsg(
        `Translated ${result.fields || 0} fields to ${result.langs?.join(", ") || "all languages"}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setTranslating(false);
    }
  }

  function update<K extends keyof StoryFormData>(key: K, value: StoryFormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function updateTitle(lang: string, value: string) {
    setData((prev) => ({ ...prev, title: { ...prev.title, [lang]: value } }));
  }

  function updateDescription(lang: string, value: string) {
    setData((prev) => ({ ...prev, description: { ...prev.description, [lang]: value } }));
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

  // Chapter management
  function addChapter() {
    const newChapter: ChapterItem = {
      ...DEFAULT_CHAPTER,
      order: data.chapters.length + 1,
    };
    update("chapters", [...data.chapters, newChapter]);
  }

  function updateChapter(index: number, chapter: ChapterItem) {
    const updated = [...data.chapters];
    updated[index] = chapter;
    update("chapters", updated);
  }

  function removeChapter(index: number) {
    const updated = data.chapters.filter((_, i) => i !== index);
    // Re-number orders
    updated.forEach((ch, i) => (ch.order = i + 1));
    update("chapters", updated);
  }

  function moveChapter(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= data.chapters.length) return;
    const updated = [...data.chapters];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((ch, i) => (ch.order = i + 1));
    update("chapters", updated);
  }

  function getImageUrl(relativePath: string): string {
    if (!relativePath) return "";
    if (relativePath.startsWith("http")) return relativePath;
    return `https://firebasestorage.googleapis.com/v0/b/flexme-now.firebasestorage.app/o/${encodeURIComponent(relativePath)}?alt=media`;
  }

  async function handleImageUpload(file: File) {
    const ext = file.name.split(".").pop() || "webp";
    const id = storyId || "new";
    const gcsPath = `mockup-images/stories/${id}/cover.${ext}`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", gcsPath);

    setUploadingCover(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      update("coverImage", gcsPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSave() {
    if (!data.title.en) {
      setError("English title is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("adminToken") || "";
      const vParam = version ? `?version=${version}` : "";
      const url = storyId ? `/api/stories/${storyId}${vParam}` : `/api/stories${vParam}`;
      const method = storyId ? "PUT" : "POST";

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

      router.push("/stories");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`space-y-6${readOnly ? " pointer-events-none opacity-70" : ""}`}>
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

      {/* Title + Description (i18n) */}
      <div className="card">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
          Story Title & Description
        </h3>
        <div className="mb-3 flex items-center justify-between border-b border-neutral-800">
          <div className="flex gap-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  activeLang === lang
                    ? "border-b-2 border-brand text-brand"
                    : data.title[lang]
                    ? "text-green-400 hover:text-green-300"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          {storyId && !readOnly && (
            <button
              onClick={handleTranslate}
              disabled={translating}
              className="mb-1 flex items-center gap-1.5 rounded-md bg-blue-600/20 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-600/30 disabled:opacity-50"
            >
              <svg className={`h-3.5 w-3.5 ${translating ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {translating ? "Translating..." : "Auto-translate from EN"}
            </button>
          )}
        </div>
        {translateMsg && (
          <div className="mb-3 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
            {translateMsg}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="label">Title ({LANGUAGE_LABELS[activeLang]})</label>
            <input
              type="text"
              value={data.title[activeLang] || ""}
              onChange={(e) => updateTitle(activeLang, e.target.value)}
              className="input"
              placeholder="Story title"
            />
          </div>
          <div>
            <label className="label">Description ({LANGUAGE_LABELS[activeLang]})</label>
            <textarea
              value={data.description[activeLang] || ""}
              onChange={(e) => updateDescription(activeLang, e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="Short description"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="card">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
          Basic Information
        </h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div>
            <label className="label">Slug</label>
            <input
              type="text"
              value={data.slug}
              onChange={(e) => update("slug", e.target.value)}
              className="input"
              placeholder="auto_from_title"
            />
          </div>
          <div>
            <label className="label">Category</label>
            <input
              type="text"
              value={data.category}
              onChange={(e) => update("category", e.target.value)}
              className="input"
              placeholder="e.g., adventure"
            />
          </div>
          <div>
            <label className="label">Type</label>
            <input
              type="text"
              value={data.type}
              onChange={(e) => update("type", e.target.value)}
              className="input"
              placeholder="e.g., story"
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
            <label className="label">Duration</label>
            <select
              value={data.duration}
              onChange={(e) => update("duration", e.target.value)}
              className="select"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
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
                <option key={b} value={b}>{b || "None"}</option>
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
          <div className="flex items-end gap-6 col-span-2">
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
              <button onClick={() => removeTag(tag)} className="ml-1 text-brand/60 hover:text-brand">
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
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            className="input flex-1"
            placeholder="Add tag and press Enter"
          />
          <button onClick={addTag} className="btn-secondary text-sm">Add</button>
        </div>
      </div>

      {/* Cover Image */}
      <div className="card">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
          Cover Image
        </h3>
        <div className="flex items-start gap-4">
          <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-700 bg-bg-elevated transition-colors hover:border-neutral-600">
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
                <span className="text-xs text-neutral-500">Upload</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
          </label>
          {data.coverImage && (
            <div className="text-xs text-neutral-500 pt-1">
              <p className="break-all">{data.coverImage}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chapters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Chapters ({data.chapters.length})
          </h3>
          <button onClick={addChapter} className="btn-secondary text-sm">
            <svg className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Chapter
          </button>
        </div>

        {data.chapters.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">
            No chapters yet. Click &quot;Add Chapter&quot; to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {data.chapters.map((chapter, index) => (
              <ChapterEditor
                key={index}
                chapter={chapter}
                index={index}
                onChange={(ch) => updateChapter(index, ch)}
                onRemove={() => removeChapter(index)}
                onMoveUp={() => moveChapter(index, -1)}
                onMoveDown={() => moveChapter(index, 1)}
                isFirst={index === 0}
                isLast={index === data.chapters.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inline Test Generate */}
      {storyId && !readOnly && data.chapters.length > 0 && (
        <TestGenerate
          type="story"
          id={storyId}
          chapterCount={data.chapters.length}
        />
      )}

      {/* Actions */}
      {!readOnly && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? "Saving..." : storyId ? "Update Story" : "Create Story"}
          </button>
          <button
            onClick={() => router.push("/stories")}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
