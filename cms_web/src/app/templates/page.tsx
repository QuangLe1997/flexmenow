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
}

function getImageUrl(relativePath: string): string {
  if (!relativePath) return "";
  if (relativePath.startsWith("http")) return relativePath;
  return `https://firebasestorage.googleapis.com/v0/b/flexme-now.firebasestorage.app/o/${encodeURIComponent(relativePath)}?alt=media`;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
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
  const pageSize = 20;

  const isReadOnly = versionStatus === "published" || versionStatus === "archived";

  // Fetch version status when selectedVersion changes
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

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {total > 0 ? `${total} templates` : "Manage FlexShot templates"}
            {version && ` · v${version}`}
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

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
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
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 bg-bg-elevated">
                <th className="table-header">Cover</th>
                <th className="table-header">Name</th>
                <th className="table-header">Category</th>
                <th className="table-header">Type</th>
                <th className="table-header">Gender</th>
                <th className="table-header">Credits</th>
                <th className="table-header">Badge</th>
                <th className="table-header">Premium</th>
                <th className="table-header">Active</th>
                <th className="table-header">Order</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-neutral-500">
                    Loading...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-neutral-500">
                    No templates found
                  </td>
                </tr>
              ) : (
                templates.map((tmpl) => (
                  <tr key={tmpl.id} className="transition-colors hover:bg-bg-hover">
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
                    <td className="table-cell capitalize">{tmpl.category}</td>
                    <td className="table-cell capitalize">{tmpl.type}</td>
                    <td className="table-cell capitalize">{tmpl.gender}</td>
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
                            onClick={() => handleDelete(tmpl.id)}
                            className="rounded p-1 text-neutral-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
