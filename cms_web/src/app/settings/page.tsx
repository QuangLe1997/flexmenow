"use client";

import { useState, useEffect } from "react";

interface CategoryItem {
  id: string;
  name: Record<string, string>;
  icon?: string;
  color?: string;
  sortOrder: number;
}

interface PromptSnippet {
  id: string;
  label: string;
  category: "negative" | "style" | "base" | "variable";
  content: string;
}

const SNIPPET_CATEGORIES = ["negative", "style", "base", "variable"] as const;
const SNIPPET_LABELS: Record<string, string> = {
  negative: "Negative Prompt",
  style: "Style Hint",
  base: "Base Prompt",
  variable: "Variable",
};

export default function SettingsPage() {
  // Categories
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCat, setEditCat] = useState<CategoryItem | null>(null);
  const [newCat, setNewCat] = useState({ id: "", nameEn: "", icon: "", color: "" });
  // Types/Genders
  const [newType, setNewType] = useState("");
  const [newGender, setNewGender] = useState("");
  // Prompt Snippets
  const [snippets, setSnippets] = useState<PromptSnippet[]>([]);
  const [snippetLoading, setSnippetLoading] = useState(true);
  const [newSnippet, setNewSnippet] = useState({ label: "", category: "negative" as string, content: "" });
  const [editSnippet, setEditSnippet] = useState<PromptSnippet | null>(null);
  // Drag
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";

  useEffect(() => {
    fetchCategories();
    fetchSnippets();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/templates/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setTypes(data.types || []);
        setGenders(data.genders || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function fetchSnippets() {
    setSnippetLoading(true);
    try {
      const res = await fetch("/api/prompt-snippets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSnippets(data.snippets || []);
      }
    } catch { /* ignore */ }
    setSnippetLoading(false);
  }

  async function categoryAction(action: string, body: Record<string, unknown>) {
    const res = await fetch("/api/templates/categories", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await res.json();
    if (res.ok && data.categories) setCategories(data.categories);
    else if (!res.ok) alert(data.error || "Failed");
    return res.ok;
  }

  async function handleAddCategory() {
    if (!newCat.id || !newCat.nameEn) return;
    const ok = await categoryAction("add", {
      category: {
        id: newCat.id.toLowerCase().replace(/\s+/g, "_"),
        name: { en: newCat.nameEn },
        icon: newCat.icon,
        color: newCat.color,
        sortOrder: categories.length,
      },
    });
    if (ok) setNewCat({ id: "", nameEn: "", icon: "", color: "" });
  }

  async function handleUpdateCategory() {
    if (!editCat) return;
    await categoryAction("update", { category: editCat });
    setEditCat(null);
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm(`Delete category "${id}"? Templates in this category will NOT be deleted.`)) return;
    await categoryAction("delete", { categoryId: id });
  }

  function handleCatDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleCatDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setCategories(reordered);
    setDragIdx(idx);
  }

  async function handleCatDragEnd() {
    setDragIdx(null);
    await categoryAction("reorder", { orderedIds: categories.map((c) => c.id) });
  }

  async function handleSaveMeta(field: "types" | "genders") {
    await categoryAction("saveMeta", {
      [field]: field === "types" ? types : genders,
    });
  }

  // Prompt snippet actions
  async function snippetAction(action: string, body: Record<string, unknown> | PromptSnippet) {
    const res = await fetch("/api/prompt-snippets", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    if (res.ok) fetchSnippets();
    else {
      const data = await res.json();
      alert(data.error || "Failed");
    }
  }

  async function handleAddSnippet() {
    if (!newSnippet.label || !newSnippet.content) return;
    await snippetAction("create", newSnippet);
    setNewSnippet({ label: "", category: "negative", content: "" });
  }

  async function handleUpdateSnippet() {
    if (!editSnippet) return;
    await snippetAction("update", editSnippet);
    setEditSnippet(null);
  }

  async function handleDeleteSnippet(id: string) {
    if (!confirm("Delete this snippet?")) return;
    await snippetAction("delete", { id });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Categories */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-white">Template Categories</h2>
        <p className="mb-4 text-xs text-neutral-400">
          Drag to reorder. Changes save automatically. Order affects display on app.
        </p>

        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                draggable
                onDragStart={() => handleCatDragStart(idx)}
                onDragOver={(e) => handleCatDragOver(e, idx)}
                onDragEnd={handleCatDragEnd}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                  dragIdx === idx
                    ? "border-brand/50 bg-brand/5"
                    : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-600"
                }`}
              >
                {/* Drag handle */}
                <svg className="h-4 w-4 cursor-grab text-neutral-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                </svg>

                {cat.color && (
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white">{cat.name.en || cat.id}</span>
                  <span className="ml-2 text-xs text-neutral-500">{cat.id}</span>
                </div>

                {cat.icon && <span className="text-sm">{cat.icon}</span>}

                <button
                  onClick={() => setEditCat({ ...cat })}
                  className="rounded p-1 text-neutral-400 hover:text-white transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="rounded p-1 text-neutral-400 hover:text-red-400 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Edit modal */}
        {editCat && (
          <div className="mt-4 rounded-lg border border-brand/30 bg-brand/5 p-4">
            <h4 className="mb-3 text-sm font-medium text-brand">Edit: {editCat.id}</h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="label">Name (EN)</label>
                <input
                  value={editCat.name.en || ""}
                  onChange={(e) => setEditCat({ ...editCat, name: { ...editCat.name, en: e.target.value } })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Icon</label>
                <input
                  value={editCat.icon || ""}
                  onChange={(e) => setEditCat({ ...editCat, icon: e.target.value })}
                  className="input"
                  placeholder="emoji"
                />
              </div>
              <div>
                <label className="label">Color</label>
                <input
                  type="color"
                  value={editCat.color || "#888888"}
                  onChange={(e) => setEditCat({ ...editCat, color: e.target.value })}
                  className="input h-10"
                />
              </div>
              <div className="flex items-end gap-2">
                <button onClick={handleUpdateCategory} className="btn-primary text-sm">Save</button>
                <button onClick={() => setEditCat(null)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Add new */}
        <div className="mt-4 border-t border-neutral-800 pt-4">
          <h4 className="mb-3 text-sm font-medium text-neutral-300">Add Category</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <input
              value={newCat.id}
              onChange={(e) => setNewCat({ ...newCat, id: e.target.value })}
              className="input"
              placeholder="ID (e.g. business)"
            />
            <input
              value={newCat.nameEn}
              onChange={(e) => setNewCat({ ...newCat, nameEn: e.target.value })}
              className="input"
              placeholder="Name EN"
            />
            <input
              value={newCat.icon}
              onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
              className="input"
              placeholder="Icon (emoji)"
            />
            <input
              type="color"
              value={newCat.color || "#888888"}
              onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
              className="input h-10"
            />
            <button onClick={handleAddCategory} className="btn-primary text-sm">
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Types & Genders */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-white">Template Types</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {types.map((t, i) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
                {t}
                <button
                  onClick={() => { setTypes(types.filter((_, j) => j !== i)); }}
                  className="ml-1 text-neutral-500 hover:text-red-400"
                >&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newType.trim()) {
                  setTypes([...types, newType.trim().toLowerCase()]);
                  setNewType("");
                }
              }}
              className="input flex-1"
              placeholder="Add type..."
            />
            <button onClick={() => handleSaveMeta("types")} className="btn-primary text-sm">Save</button>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-white">Gender Options</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {genders.map((g, i) => (
              <span key={g} className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
                {g}
                <button
                  onClick={() => { setGenders(genders.filter((_, j) => j !== i)); }}
                  className="ml-1 text-neutral-500 hover:text-red-400"
                >&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newGender}
              onChange={(e) => setNewGender(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newGender.trim()) {
                  setGenders([...genders, newGender.trim().toLowerCase()]);
                  setNewGender("");
                }
              }}
              className="input flex-1"
              placeholder="Add gender..."
            />
            <button onClick={() => handleSaveMeta("genders")} className="btn-primary text-sm">Save</button>
          </div>
        </div>
      </div>

      {/* Prompt Snippets */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-white">Prompt Snippets Library</h2>
        <p className="mb-4 text-xs text-neutral-400">
          Reusable prompt fragments. Insert into any template&apos;s prompt fields with one click.
        </p>

        {snippetLoading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : (
          <div className="space-y-4">
            {SNIPPET_CATEGORIES.map((cat) => {
              const catSnippets = snippets.filter((s) => s.category === cat);
              if (catSnippets.length === 0) return null;
              return (
                <div key={cat}>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {SNIPPET_LABELS[cat]}
                  </h4>
                  <div className="space-y-1">
                    {catSnippets.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-start gap-3 rounded-lg border border-neutral-700 bg-neutral-800/50 p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white">{s.label}</div>
                          <p className="mt-1 text-xs text-neutral-400 whitespace-pre-wrap">{s.content}</p>
                        </div>
                        <button
                          onClick={() => setEditSnippet({ ...s })}
                          className="rounded p-1 text-neutral-400 hover:text-white transition-colors flex-shrink-0"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSnippet(s.id)}
                          className="rounded p-1 text-neutral-400 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit snippet */}
        {editSnippet && (
          <div className="mt-4 rounded-lg border border-brand/30 bg-brand/5 p-4">
            <h4 className="mb-3 text-sm font-medium text-brand">Edit Snippet</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={editSnippet.label}
                  onChange={(e) => setEditSnippet({ ...editSnippet, label: e.target.value })}
                  className="input"
                  placeholder="Label"
                />
                <select
                  value={editSnippet.category}
                  onChange={(e) => setEditSnippet({ ...editSnippet, category: e.target.value as PromptSnippet["category"] })}
                  className="select"
                >
                  {SNIPPET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{SNIPPET_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={editSnippet.content}
                onChange={(e) => setEditSnippet({ ...editSnippet, content: e.target.value })}
                className="input min-h-[80px] resize-y"
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={handleUpdateSnippet} className="btn-primary text-sm">Save</button>
                <button onClick={() => setEditSnippet(null)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Add snippet */}
        <div className="mt-4 border-t border-neutral-800 pt-4">
          <h4 className="mb-3 text-sm font-medium text-neutral-300">Add Snippet</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={newSnippet.label}
                onChange={(e) => setNewSnippet({ ...newSnippet, label: e.target.value })}
                className="input"
                placeholder="Label (e.g. Standard Negative)"
              />
              <select
                value={newSnippet.category}
                onChange={(e) => setNewSnippet({ ...newSnippet, category: e.target.value })}
                className="select"
              >
                {SNIPPET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{SNIPPET_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <textarea
              value={newSnippet.content}
              onChange={(e) => setNewSnippet({ ...newSnippet, content: e.target.value })}
              className="input min-h-[80px] resize-y"
              placeholder="Prompt content..."
              rows={3}
            />
            <button onClick={handleAddSnippet} className="btn-primary text-sm">Add Snippet</button>
          </div>
        </div>
      </div>
    </div>
  );
}
