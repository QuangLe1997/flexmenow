"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { VersionSelector } from "@/components/version-selector";
import { PublishDialog } from "@/components/publish-dialog";

interface Story {
  id: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  category: string;
  type: string;
  gender: string;
  duration: string;
  totalPics: number;
  credits: number;
  badge: string | null;
  premium: boolean;
  isActive: boolean;
  coverImage: string;
  sortOrder: number;
  chapters: unknown[];
  stats?: { likes: number; views: number; generates: number };
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

function getTranslationStatus(title: Record<string, string>) {
  const filled = ALL_LANGS.filter((l) => title[l]?.trim());
  return { filled, total: ALL_LANGS.length, complete: filled.length === ALL_LANGS.length };
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
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
  // Bulk select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Batch translate
  const [batchTranslating, setBatchTranslating] = useState(false);
  const pageSize = 20;

  const isReadOnly = versionStatus === "published" || versionStatus === "archived";

  useEffect(() => {
    async function fetchStatus() {
      if (!selectedVersion) return;
      try {
        const token = localStorage.getItem("adminToken") || "";
        const res = await fetch(`/api/versions?type=stories`, {
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

  const fetchStories = useCallback(async () => {
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

      const res = await fetch(`/api/stories?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStories(data.stories || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setVersion(data.version || "");
    } catch (error) {
      console.error("Failed to fetch stories:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, selectedVersion]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

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
      const res = await fetch("/api/stories/publish", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body && { "Content-Type": "application/json" }),
        },
        ...(body && { body }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Published ${data.count} stories (v${data.version}). ${data.activeCount} active.`);
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
    if (!confirm("Duplicate this story?")) return;
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch(`/api/stories/${id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Duplicated as ${data.id}: ${data.title.en}`);
        fetchStories();
      } else {
        const data = await res.json();
        alert(data.error || "Duplicate failed");
      }
    } catch {
      alert("Duplicate failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this story?")) return;
    try {
      const token = localStorage.getItem("adminToken") || "";
      const vParam = selectedVersion ? `?version=${selectedVersion}` : "";
      const res = await fetch(`/api/stories/${id}${vParam}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchStories();
      } else {
        const data = await res.json();
        alert(data.error || "Delete failed");
      }
    } catch {
      alert("Delete failed");
    }
  }

  async function handleBatchTranslate() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Translate ${selectedIds.size} story(ies) from EN to all languages?`)) return;

    setBatchTranslating(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch("/api/translate/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "story",
          ids: [...selectedIds],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Translated: ${data.success} success, ${data.errors} errors, ${data.skipped} skipped`);
        setSelectedIds(new Set());
        fetchStories();
      } else {
        alert(data.error || "Batch translate failed");
      }
    } catch {
      alert("Batch translate failed");
    } finally {
      setBatchTranslating(false);
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
    if (selectedIds.size === stories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(stories.map((s) => s.id)));
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Stories</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {total > 0 ? `${total} stories` : "Manage FlexTale stories"}
            {version && ` · v${version}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <VersionSelector
            type="stories"
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
              href={`/stories/new${selectedVersion ? `?version=${selectedVersion}` : ""}`}
              className="btn-primary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Story
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

      {/* Filters + bulk actions */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search stories by title, ID, or tag..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-10"
          />
        </div>
        <input
          type="text"
          placeholder="Filter by category..."
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="input w-auto max-w-[200px]"
        />

        {/* Bulk actions */}
        {!isReadOnly && selectedIds.size > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2">
            <span className="text-xs font-medium text-brand">
              {selectedIds.size} selected
            </span>
            <span className="text-neutral-600">|</span>
            <button
              onClick={handleBatchTranslate}
              disabled={batchTranslating}
              className="btn-secondary text-xs py-1 px-2"
            >
              {batchTranslating ? "Translating..." : "Translate All"}
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
                      checked={stories.length > 0 && selectedIds.size === stories.length}
                      onChange={toggleSelectAll}
                      className="accent-brand"
                    />
                  </th>
                )}
                <th className="table-header">Cover</th>
                <th className="table-header">Title</th>
                <th className="table-header">i18n</th>
                <th className="table-header">Category</th>
                <th className="table-header">Chapters</th>
                <th className="table-header">Credits</th>
                <th className="table-header">Duration</th>
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
              ) : stories.length === 0 ? (
                <tr>
                  <td colSpan={isReadOnly ? 12 : 13} className="px-4 py-12 text-center text-neutral-500">
                    No stories found
                  </td>
                </tr>
              ) : (
                stories.map((story) => {
                  const i18nStatus = getTranslationStatus(story.title);
                  return (
                    <tr
                      key={story.id}
                      className={`transition-colors hover:bg-bg-hover ${
                        selectedIds.has(story.id) ? "bg-brand/5" : ""
                      }`}
                    >
                      {!isReadOnly && (
                        <td className="table-cell w-8">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(story.id)}
                            onChange={() => toggleSelect(story.id)}
                            className="accent-brand"
                          />
                        </td>
                      )}
                      <td className="table-cell">
                        {story.coverImage ? (
                          <img
                            src={getImageUrl(story.coverImage)}
                            alt={story.title.en || ""}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-bg-elevated text-neutral-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="font-medium text-white">{story.title.en || story.id}</div>
                        <div className="text-xs text-neutral-500">{story.id}</div>
                      </td>
                      {/* Translation status */}
                      <td className="table-cell">
                        <div className="flex gap-0.5" title={`${i18nStatus.filled.length}/${i18nStatus.total} languages`}>
                          {ALL_LANGS.map((lang) => (
                            <span
                              key={lang}
                              className={`inline-block rounded px-1 py-0.5 text-[10px] font-medium leading-none ${
                                story.title[lang]?.trim()
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-neutral-700/50 text-neutral-500"
                              }`}
                            >
                              {LANG_FLAGS[lang]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="table-cell capitalize">{story.category}</td>
                      <td className="table-cell">
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                          {story.chapters?.length || story.totalPics} ch
                        </span>
                      </td>
                      <td className="table-cell">{story.credits}</td>
                      <td className="table-cell capitalize">{story.duration}</td>
                      <td className="table-cell">
                        {story.premium ? (
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
                            story.isActive ? "bg-green-500" : "bg-neutral-600"
                          }`}
                        />
                      </td>
                      {/* Stats */}
                      <td className="table-cell">
                        {story.stats ? (
                          <div className="flex gap-2 text-xs text-neutral-400">
                            <span title="Generates">{story.stats.generates || 0}g</span>
                            <span title="Views">{story.stats.views || 0}v</span>
                          </div>
                        ) : (
                          <span className="text-neutral-600">-</span>
                        )}
                      </td>
                      <td className="table-cell text-neutral-500">{story.sortOrder}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/stories/${story.id}${selectedVersion ? `?version=${selectedVersion}` : ""}`}
                            className="rounded p-1 text-neutral-400 transition-colors hover:bg-bg-elevated hover:text-white"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          {!isReadOnly && (
                            <button
                              onClick={() => handleDuplicate(story.id)}
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
                              onClick={() => handleDelete(story.id)}
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
        type="stories"
        count={total}
        version={version}
        publishing={publishing}
        targetVersion={selectedVersion}
      />
    </div>
  );
}
