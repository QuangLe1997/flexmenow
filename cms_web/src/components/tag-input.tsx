"use client";

import { useState } from "react";

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder }: Props) {
  const [input, setInput] = useState("");

  function addTag() {
    const tag = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag) => (
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          className="input flex-1"
          placeholder={placeholder || "Add tag and press Enter"}
        />
        <button onClick={addTag} className="btn-secondary text-sm">
          Add
        </button>
      </div>
    </div>
  );
}
