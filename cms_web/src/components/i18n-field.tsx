"use client";

import { useState } from "react";

const LANGUAGES = ["en", "vi", "es", "pt", "ja", "ko"] as const;
const LANGUAGE_LABELS: Record<string, string> = {
  en: "English", vi: "Vietnamese", es: "Spanish",
  pt: "Portuguese", ja: "Japanese", ko: "Korean",
};

interface Props {
  label: string;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}

export function I18nField({ label, value, onChange, multiline, rows = 3, placeholder }: Props) {
  const [activeLang, setActiveLang] = useState<string>("en");

  function handleChange(lang: string, text: string) {
    onChange({ ...value, [lang]: text });
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="mb-2 flex gap-1 border-b border-neutral-800">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
              activeLang === lang
                ? "border-b-2 border-brand text-brand"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {lang.toUpperCase()}
            {value[lang] ? "" : " ·"}
          </button>
        ))}
      </div>
      {multiline ? (
        <textarea
          value={value[activeLang] || ""}
          onChange={(e) => handleChange(activeLang, e.target.value)}
          className="input min-h-[60px] resize-y"
          placeholder={placeholder || `${label} in ${LANGUAGE_LABELS[activeLang]}`}
          rows={rows}
        />
      ) : (
        <input
          type="text"
          value={value[activeLang] || ""}
          onChange={(e) => handleChange(activeLang, e.target.value)}
          className="input"
          placeholder={placeholder || `${label} in ${LANGUAGE_LABELS[activeLang]}`}
        />
      )}
    </div>
  );
}
