"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { VersionSelector } from "@/components/version-selector";
import { PublishDialog } from "@/components/publish-dialog";

interface Template {
  id: string;
  name: Record<string, string>;
  category: string;
  type: string;
  gender: string;
  credits: number;
  badge: string | null;
  premium: boolean;
  isActive: boolean;
  coverImage: string;
  sortOrder: number;
  tags: string[];
  stats?: { likes: number; views: number; generates: number };
}

interface CategoryMeta {
  id: string;
  name: Record<string, string>;
}

const ALL_LANGS = ["en", "vi", "es", "pt", "ja", "ko"];
const LANG_FLAGS: Record<string, string> = {
  en: "EN", vi: "VI", es: "ES", pt: "PT", ja: "JA", ko: "KO",
};

function getImageUrl(relativePath: string): string {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath;
  return `https://firebasestorage.googleapis.com/v0/b/flexme-now.firebasestorage.app/o/${encodeURIComponent(relativePath)}?alt=media`;
}

function getTranslationStatus(name: Record<string, string>) {
  const filled = ALL_LANGS.filter((l) => name[l]?.trim());
  return { filled, total: ALL_LANGS.length, complete: filled.length === ALL_LANGS.length };
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [version, setVersion] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [versionStatus, setVersionStatus] = useState<string>("");
  const [publishing, setPublishing] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveTarget, setMoveTarget] = useState("");
  const [moving, setMoving] = useState(false);
  // Bulk actions
  const [bulkAction, setBulkAction] = useState("");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  // Batch translate
  const [batchTranslating, setBatchTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState("");
  // Drag & drop reorder
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  const pageSize = 20;
  const isReadOnly = versionStatus === "published" || versionStatus === "archived";

  // Fetch categories from cms_meta
  useEffect(() => {
    async function fetchCategories() {
      try {
        const token = localStorage.getItem("adminToken") || "";
        const res = await fetch("/api/templates/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch {
        // ignore
      }
    }
    fetchCategories();
  }, []);

  // Fetch version status
  useEffect(() => {
    async function fetchStatus() {
      if (!selectedVersion) return;
      try {
        const token = localStorage.getItem("adminToken") || "";
        const res = await fetch(`/api/versions?type=templates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const v = data.versions?.find((vi: { version: string }) => vi.version === selectedVersion);
        setVersionStatus(v?.status || "");
      } catch {
        // ignore
      }
    }
    fetchStatus();
  }, [selectedVersion]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
        ...(category && { category }),
        ...(selectedVersion && { version: selectedVersion }),
      });

      const res = await fetch(`/api/templates?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTemplates(data.templates || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setVersion(data.version || "");
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, selectedVersion]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [category, search, page]);

  async function handlePublish() {
    setPublishing(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const body = selectedVersion && versionStatus === "review"
        ? JSON.stringify({ version: selectedVersion })
        : undefined;
      const res = await fetch("/api/templates/publish", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body && { "Content-Type": "application/json" }),
        },
        ...(body && { body }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Published ${data.count} templates (v${data.version}). ${data.activeCount} active.`);
        setVersion(data.version);
        setVersionStatus("published");
        setShowPublishDialog(false);
      } else {
        alert(`Publish failed: ${data.error}`);
      }
    } catch {
      alert("Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  async function handleDuplicate(id: string) {
    if (!confirm("Duplicate this template?")) return;
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch(`/api/templates/${id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Duplicated as ${data.id}: ${data.name.en}`);
        fetchTemplates();
      } else {
        const data = await res.json();
        alert(data.error || "Duplicate failed");
      }
    } catch {
      alert("Duplicate failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    try {
      const token = localStorage.getItem("adminToken") || "";
      const vParam = selectedVersion ? `?version=${selectedVersion}` : "";
      const res = await fetch(`/api/templates/${id}${vParam}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchTemplates();
      } else {
        const data = await res.json();
        alert(data.error || "Delete failed");
      }
    } catch {
      alert("Delete failed");
    }
  }

  async function handleBulkMove() {
    if (selectedIds.size === 0 || !moveTarget) return;
    if (!confirm(`Move ${selectedIds.size} template(s) to "${moveTarget}"?`)) return;

    setMoving(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch("/api/templates/bulk-move", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateIds: [...selectedIds],
          targetCategory: moveTarget,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Moved ${data.moved} templates to "${moveTarget}"`);
        setSelectedIds(new Set());
        setMoveTarget("");
        fetchTemplates();
      } else {
        const data = await res.json();
        alert(data.error || "Move failed");
      }
    } catch {
      alert("Move failed");
    } finally {
      setMoving(false);
    }
  }

  async function handleBulkAction() {
    if (selectedIds.size === 0 || !bulkAction) return;

    let value: unknown = undefined;
    if (bulkAction === "setBadge") {
      value = bulkValue || null;
    } else if (bulkAction === "setPremium") {
      value = true;
    } else if (bulkAction === "removePremium") {
      // setPremium with false
    } else if (bulkAction === "setCredits") {
      const num = parseInt(bulkValue);
      if (isNaN(num) || num < 0) {
        alert("Please enter a valid credits number");
        return;
      }
      value = num;
    }

    const actionLabel = {
      activate: "Activate",
      deactivate: "Deactivate",
      delete: "DELETE",
      setBadge: `Set badge "${bulkValue}"`,
      setPremium: "Set Premium",
      removePremium: "Remove Premium",
      setCredits: `Set credits to ${bulkValue}`,
    }[bulkAction] || bulkAction;

    if (!confirm(`${actionLabel} ${selectedIds.size} template(s)?`)) return;

    setBulkProcessing(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const apiAction = bulkAction === "removePremium" ? "setPremium" : bulkAction;
      const apiValue = bulkAction === "removePremium" ? false : value;

      const res = await fetch("/api/templates/bulk-actions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateIds: [...selectedIds],
          action: apiAction,
          value: apiValue,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`${actionLabel}: ${data.count} templates updated`);
        setSelectedIds(new Set());
        setBulkAction("");
        setBulkValue("");
        fetchTemplates();
      } else {
        const data = await res.json();
        alert(data.error || "Bulk action failed");
      }
    } catch {
      alert("Bulk action failed");
    } finally {
      setBulkProcessing(false);
    }
  }

  async function handleBatchTranslate() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Translate ${selectedIds.size} template(s) from EN to all languages?`)) return;

    setBatchTranslating(true);
    setTranslateProgress(`Translating 0/${selectedIds.size}...`);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch("/api/translate/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "template",
          ids: [...selectedIds],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTranslateProgress("");
        alert(`Translated: ${data.success} success, ${data.errors} errors, ${data.skipped} skipped`);
        setSelectedIds(new Set());
        fetchTemplates();
      } else {
        alert(data.error || "Batch translate failed");
      }
    } catch {
      alert("Batch translate failed");
    } finally {
      setBatchTranslating(false);
      setTranslateProgress("");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === templates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(templates.map((t) => t.id)));
    }
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...templates];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setTemplates(reordered);
    setDragIdx(idx);
  }

  async function handleDragEnd() {
    setDragIdx(null);
    setReordering(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      await fetch("/api/templates/reorder", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderedIds: templates.map((t) => t.id) }),
      });
    } catch {
      // silent
    }
    setReordering(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {total > 0 ? `${total} templates` : "Manage FlexShot templates"}
            {version && ` · v${version}`}
            {category && ` · ${category}`}
            {reordering && " · Saving order..."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <VersionSelector
            type="templates"
            selectedVersion={selectedVersion}
            onVersionChange={setSelectedVersion}
          />
          {versionStatus === "review" && (
            <button
              onClick={() => setShowPublishDialog(true)}
              disabled={publishing}
              className="btn-secondary"
            >
              {publishing ? "Publishing..." : `Publish v${selectedVersion}`}
            </button>
          )}
          {!isReadOnly && (
            <Link
              href={`/templates/new${selectedVersion ? `?version=${selectedVersion}` : ""}`}
              className="btn-primary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Template
            </Link>
          )}
        </div>
      </div>

      {/* Read-only banner */}
      {isReadOnly && (
        <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          This version is {versionStatus} and read-only. Create a new review version to make changes.
        </div>
      )}

      {/* Category tabs */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => { setCategory(""); setPage(1); }}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            !category
              ? "bg-brand/20 text-brand border border-brand/40"
              : "bg-neutral-800/50 text-neutral-400 border border-neutral-700 hover:text-white"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setCategory(cat.id); setPage(1); }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              category === cat.id
                ? "bg-brand/20 text-brand border border-brand/40"
                : "bg-neutral-800/50 text-neutral-400 border border-neutral-700 hover:text-white"
            }`}
          >
            {cat.name.en || cat.id}
          </button>
        ))}
      </div>

      {/* Search + Bulk actions */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search templates by name, ID, or tag..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-10"
          />
        </div>

        {/* Bulk actions bar */}
        {!isReadOnly && selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2">
            <span className="text-xs font-medium text-brand">
              {selectedIds.size} selected
            </span>
            <span className="text-neutral-600">|</span>

            {/* Move */}
            <select
              value={moveTarget}
              onChange={(e) => setMoveTarget(e.target.value)}
              className="input w-auto text-xs py-1"
            >
              <option value="">Move to...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name.en || cat.id}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkMove}
              disabled={!moveTarget || moving}
              className="btn-secondary text-xs py-1 px-2"
            >
              {moving ? "..." : "Move"}
            </button>

            <span className="text-neutral-600">|</span>

            {/* Bulk action */}
            <select
              value={bulkAction}
              onChange={(e) => { setBulkAction(e.target.value); setBulkValue(""); }}
              className="input w-auto text-xs py-1"
            >
              <option value="">Action...</option>
              <option value="activate">Activate</option>
              <option value="deactivate">Deactivate</option>
              <option value="setPremium">Set Premium</option>
              <option value="removePremium">Remove Premium</option>
              <option value="setBadge">Set Badge</option>
              <option value="setCredits">Set Credits</option>
              <option value="delete">Delete</option>
            </select>

            {bulkAction === "setBadge" && (
              <select
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                className="input w-auto text-xs py-1"
              >
                <option value="">None</option>
                <option value="new">new</option>
                <option value="hot">hot</option>
                <option value="trending">trending</option>
                <option value="popular">popular</option>
              </select>
            )}

            {bulkAction === "setCredits" && (
              <input
                type="number"
                min="0"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                placeholder="Credits"
                className="input w-20 text-xs py-1"
              />
            )}

            {bulkAction && (
              <button
                onClick={handleBulkAction}
                disabled={bulkProcessing}
                className={`text-xs py-1 px-2 ${
                  bulkAction === "delete" ? "btn-danger" : "btn-primary"
                }`}
              >
                {bulkProcessing ? "..." : "Apply"}
              </button>
            )}

            <span className="text-neutral-600">|</span>

            {/* Batch translate */}
            <button
              onClick={handleBatchTranslate}
              disabled={batchTranslating}
              className="btn-secondary text-xs py-1 px-2"
              title="Translate selected from EN to all languages"
            >
              {batchTranslating ? translateProgress || "Translating..." : "Translate All"}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 bg-bg-elevated">
                {!isReadOnly && (
                  <th className="table-header w-8">
                    <input
                      type="checkbox"
                      checked={templates.length > 0 && selectedIds.size === templates.length}
                      onChange={toggleSelectAll}
                      className="accent-brand"
                    />
                  </th>
                )}
                <th className="table-header">Cover</th>
                <th className="table-header">Name</th>
                <th className="table-header">i18n</th>
                <th className="table-header">Category</th>
                <th className="table-header">Type</th>
                <th className="table-header">Credits</th>
                <th className="table-header">Badge</th>
                <th className="table-header">Premium</th>
                <th className="table-header">Active</th>
                <th className="table-header">Stats</th>
                <th className="table-header">Order</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={isReadOnly ? 12 : 13} className="px-4 py-12 text-center text-neutral-500">
                    Loading...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 12 : 13} className="px-4 py-12 text-center text-neutral-500">
                    No templates found
                  </td>
                </tr>
              ) : (
                templates.map((tmpl, idx) => {
                  const i18nStatus = getTranslationStatus(tmpl.name);
                  return (
                    <tr
                      key={tmpl.id}
                      draggable={!isReadOnly}
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`transition-colors hover:bg-bg-hover ${
                        selectedIds.has(tmpl.id) ? "bg-brand/5" : ""
                      } ${dragIdx === idx ? "opacity-50 bg-brand/10" : ""} ${!isReadOnly ? "cursor-grab" : ""}`}
                    >
                      {!isReadOnly && (
                        <td className="table-cell w-8">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(tmpl.id)}
                            onChange={() => toggleSelect(tmpl.id)}
                            className="accent-brand"
                          />
                        </td>
                      )}
                      <td className="table-cell">
                        {tmpl.coverImage ? (
                          <img
                            src={getImageUrl(tmpl.coverImage)}
                            alt={tmpl.name.en || ""}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-elevated text-neutral-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="font-medium text-white">{tmpl.name.en || tmpl.id}</div>
                        <div className="text-xs text-neutral-500">{tmpl.id}</div>
                      </td>
                      {/* Translation status */}
                      <td className="table-cell">
                        <div className="flex gap-0.5" title={`${i18nStatus.filled.length}/${i18nStatus.total} languages`}>
                          {ALL_LANGS.map((lang) => (
                            <span
                              key={lang}
                              className={`inline-block rounded px-1 py-0.5 text-[10px] font-medium leading-none ${
                                tmpl.name[lang]?.trim()
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-neutral-700/50 text-neutral-500"
                              }`}
                            >
                              {LANG_FLAGS[lang]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-300 capitalize">
                          {tmpl.category}
                        </span>
                      </td>
                      <td className="table-cell capitalize">{tmpl.type}</td>
                      <td className="table-cell">{tmpl.credits}</td>
                      <td className="table-cell">
                        {tmpl.badge ? (
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                            {tmpl.badge}
                          </span>
                        ) : (
                          <span className="text-neutral-600">-</span>
                        )}
                      </td>
                      <td className="table-cell">
                        {tmpl.premium ? (
                          <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">
                            Premium
                          </span>
                        ) : (
                          <span className="text-neutral-600">Free</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`inline-flex h-2.5 w-2.5 rounded-full ${
                            tmpl.isActive ? "bg-green-500" : "bg-neutral-600"
                          }`}
                        />
                      </td>
                      {/* Stats */}
                      <td className="table-cell">
                        {tmpl.stats ? (
                          <div className="flex gap-2 text-xs text-neutral-400">
                            <span title="Generates">{tmpl.stats.generates || 0}g</span>
                            <span title="Views">{tmpl.stats.views || 0}v</span>
                            <span title="Likes">{tmpl.stats.likes || 0}l</span>
                          </div>
                        ) : (
                          <span className="text-neutral-600">-</span>
                        )}
                      </td>
                      <td className="table-cell text-neutral-500">{tmpl.sortOrder}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/templates/${tmpl.id}${selectedVersion ? `?version=${selectedVersion}` : ""}`}
                            className="rounded p-1 text-neutral-400 transition-colors hover:bg-bg-elevated hover:text-white"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          {!isReadOnly && (
                            <button
                              onClick={() => handleDuplicate(tmpl.id)}
                              className="rounded p-1 text-neutral-400 transition-colors hover:bg-blue-500/10 hover:text-blue-400"
                              title="Duplicate"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
                          {!isReadOnly && (
                            <button
                              onClick={() => handleDelete(tmpl.id)}
                              className="rounded p-1 text-neutral-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                              title="Delete"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-800 px-4 py-3">
            <p className="text-sm text-neutral-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <PublishDialog
        open={showPublishDialog}
        onClose={() => setShowPublishDialog(false)}
        onConfirm={handlePublish}
        type="templates"
        count={total}
        version={version}
        publishing={publishing}
        targetVersion={selectedVersion}
      />
    </div>
  );
}
