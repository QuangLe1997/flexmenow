"use client";

import { useState, useEffect, useRef } from "react";
import type { VersionInfo, ContentType } from "@/lib/types";
import { VersionDialog } from "./version-dialog";

interface Props {
  type: ContentType;
  selectedVersion: string;
  onVersionChange: (version: string) => void;
}

export function VersionSelector({ type, selectedVersion, onVersionChange }: Props) {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  async function fetchVersions() {
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch(`/api/versions?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setVersions(data.versions || []);

      // Auto-select published version if none selected
      if (!selectedVersion && data.published) {
        onVersionChange(data.published);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchVersions();
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = versions.find((v) => v.version === selectedVersion);

  function statusBadge(status: string) {
    switch (status) {
      case "published":
        return (
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-400">
            LIVE
          </span>
        );
      case "review":
        return (
          <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-yellow-400">
            REVIEW
          </span>
        );
      case "archived":
        return (
          <span className="rounded-full bg-neutral-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-500">
            ARCHIVED
          </span>
        );
    }
  }

  async function handleDelete(version: string) {
    if (!confirm(`Delete version ${version}?`)) return;
    setDeleting(version);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch(`/api/versions/${version}?type=${type}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchVersions();
        // If deleted current, switch to published
        if (selectedVersion === version) {
          const published = versions.find((v) => v.status === "published");
          if (published) onVersionChange(published.version);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Delete failed");
      }
    } catch {
      alert("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  function handleCreated(version: string) {
    setShowDialog(false);
    fetchVersions();
    onVersionChange(version);
  }

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-bg-elevated px-3 py-1.5 text-sm text-white transition-colors hover:border-neutral-600"
        >
          <span className="font-mono">v{selectedVersion || "..."}</span>
          {current && statusBadge(current.status)}
          <svg
            className={`h-4 w-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-neutral-800 bg-bg-card shadow-xl">
            <div className="max-h-64 overflow-y-auto p-1">
              {versions.map((v) => (
                <div
                  key={v.version}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors cursor-pointer ${
                    v.version === selectedVersion
                      ? "bg-brand/10 text-brand"
                      : "text-neutral-300 hover:bg-bg-hover"
                  }`}
                  onClick={() => {
                    onVersionChange(v.version);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-sm">v{v.version}</span>
                    {statusBadge(v.status)}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-neutral-500">{v.item_count} items</span>
                    {v.status === "review" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(v.version);
                        }}
                        disabled={deleting === v.version}
                        className="rounded p-0.5 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-neutral-800 p-1">
              <button
                onClick={() => {
                  setOpen(false);
                  setShowDialog(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-brand transition-colors hover:bg-brand/10"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Version
              </button>
            </div>
          </div>
        )}
      </div>

      <VersionDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onCreated={handleCreated}
        type={type}
        versions={versions}
      />
    </>
  );
}
