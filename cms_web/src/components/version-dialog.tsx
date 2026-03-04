"use client";

import { useState } from "react";
import type { VersionInfo, ContentType } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (version: string) => void;
  type: ContentType;
  versions: VersionInfo[];
}

export function VersionDialog({ open, onClose, onCreated, type, versions }: Props) {
  const published = versions.find((v) => v.status === "published");
  const [copyFrom, setCopyFrom] = useState(published?.version || "");
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleCreate() {
    setCreating(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch("/api/versions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, copyFrom, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNote("");
      onCreated(data.version);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create version");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4">
          New {type === "templates" ? "Templates" : "Stories"} Version
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="label">Copy from</label>
            <select
              value={copyFrom}
              onChange={(e) => setCopyFrom(e.target.value)}
              className="select"
            >
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  v{v.version} ({v.status}) — {v.item_count} items
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input"
              placeholder="e.g., Added nature templates"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={creating} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={creating} className="btn-primary">
            {creating ? "Creating..." : "Create Version"}
          </button>
        </div>
      </div>
    </div>
  );
}
