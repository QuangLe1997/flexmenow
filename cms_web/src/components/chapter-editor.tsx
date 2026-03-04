"use client";

import { useState } from "react";
import type { ChapterItem } from "@/lib/types";

const LANGUAGES = ["en", "vi", "es", "pt", "ja", "ko"] as const;
const LANGUAGE_LABELS: Record<string, string> = {
  en: "English", vi: "Vietnamese", es: "Spanish",
  pt: "Portuguese", ja: "Japanese", ko: "Korean",
};
const MODELS = ["imagen-3.0-generate-001", "imagen-3.0-generate-002", "imagen-3.0-fast-generate-001"];
const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];
const REFERENCE_TYPES = ["subject", "style", "none"];

interface Props {
  chapter: ChapterItem;
  index: number;
  onChange: (chapter: ChapterItem) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function ChapterEditor({
  chapter, index, onChange, onRemove,
  onMoveUp, onMoveDown, isFirst, isLast,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [activeLang, setActiveLang] = useState<string>("en");

  function updateField<K extends keyof ChapterItem>(key: K, value: ChapterItem[K]) {
    onChange({ ...chapter, [key]: value });
  }

  function updateHeading(lang: string, value: string) {
    onChange({ ...chapter, heading: { ...chapter.heading, [lang]: value } });
  }

  function updateText(lang: string, value: string) {
    onChange({ ...chapter, text: { ...chapter.text, [lang]: value } });
  }

  function updatePrompt(key: string, value: string) {
    onChange({ ...chapter, prompt: { ...chapter.prompt, [key]: value } });
  }

  function updateAiConfig(key: string, value: unknown) {
    onChange({ ...chapter, aiConfig: { ...chapter.aiConfig, [key]: value } });
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-bg-card overflow-hidden">
      {/* Header — always visible */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-hover transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={isFirst}
            className="rounded p-0.5 text-neutral-500 hover:text-neutral-300 disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={isLast}
            className="rounded p-0.5 text-neutral-500 hover:text-neutral-300 disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <span className="rounded bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-400">
          Ch {index + 1}
        </span>
        <span className="flex-1 text-sm font-medium text-white truncate">
          {chapter.heading?.en || `Chapter ${index + 1}`}
        </span>
        <span className="text-xs text-neutral-500">
          {chapter.prompt?.base ? `${chapter.prompt.base.split(/\s+/).filter(Boolean).length}w` : "no prompt"}
        </span>

        <svg
          className={`h-4 w-4 text-neutral-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expandable Content */}
      {expanded && (
        <div className="border-t border-neutral-800 px-4 py-4 space-y-4">
          {/* Language tabs */}
          <div className="flex gap-1 border-b border-neutral-800">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  activeLang === lang
                    ? "border-b-2 border-brand text-brand"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Heading + Text */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Heading ({LANGUAGE_LABELS[activeLang]})</label>
              <input
                type="text"
                value={chapter.heading?.[activeLang] || ""}
                onChange={(e) => updateHeading(activeLang, e.target.value)}
                className="input"
                placeholder="Chapter heading"
              />
            </div>
            <div>
              <label className="label">Text ({LANGUAGE_LABELS[activeLang]})</label>
              <textarea
                value={chapter.text?.[activeLang] || ""}
                onChange={(e) => updateText(activeLang, e.target.value)}
                className="input min-h-[80px] resize-y"
                placeholder="Chapter text / caption"
                rows={3}
              />
            </div>
          </div>

          {/* Prompt */}
          <div>
            <div className="flex items-center justify-between">
              <label className="label">Base Prompt</label>
              <span className="text-xs text-neutral-500">
                {(chapter.prompt?.base || "").split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              value={chapter.prompt?.base || ""}
              onChange={(e) => updatePrompt("base", e.target.value)}
              className="input min-h-[100px] resize-y"
              placeholder="Image generation prompt for this chapter"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Negative Prompt</label>
              <textarea
                value={chapter.prompt?.negative || ""}
                onChange={(e) => updatePrompt("negative", e.target.value)}
                className="input min-h-[60px] resize-y"
                rows={2}
              />
            </div>
            <div>
              <label className="label">Style Hint</label>
              <input
                type="text"
                value={chapter.prompt?.styleHint || ""}
                onChange={(e) => updatePrompt("styleHint", e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* AI Config */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="label">Model</label>
              <select
                value={chapter.aiConfig?.model || MODELS[0]}
                onChange={(e) => updateAiConfig("model", e.target.value)}
                className="select"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>{m.replace("imagen-3.0-", "")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Guidance</label>
              <input
                type="number"
                value={chapter.aiConfig?.guidanceScale ?? 8}
                onChange={(e) => updateAiConfig("guidanceScale", parseFloat(e.target.value) || 8)}
                className="input"
                min={1} max={20} step={0.5}
              />
            </div>
            <div>
              <label className="label">Aspect Ratio</label>
              <select
                value={chapter.aiConfig?.aspectRatio || "9:16"}
                onChange={(e) => updateAiConfig("aspectRatio", e.target.value)}
                className="select"
              >
                {ASPECT_RATIOS.map((ar) => (
                  <option key={ar} value={ar}>{ar}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Reference Type</label>
              <select
                value={chapter.aiConfig?.referenceType || "subject"}
                onChange={(e) => updateAiConfig("referenceType", e.target.value)}
                className="select"
              >
                {REFERENCE_TYPES.map((rt) => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end pt-2">
            <button
              onClick={onRemove}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remove Chapter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
