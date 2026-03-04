"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { StoryForm } from "@/components/story-form";
import { TestGenerate } from "@/components/test-generate";
import type { StoryItem } from "@/lib/types";

export default function EditStoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const version = searchParams.get("version") || undefined;
  const [story, setStory] = useState<StoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readOnly, setReadOnly] = useState(false);

  useEffect(() => {
    async function fetchStory() {
      try {
        const token = localStorage.getItem("adminToken") || "";
        const vParam = version ? `?version=${version}` : "";
        const res = await fetch(`/api/stories/${id}${vParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch story");
        const data = await res.json();
        setStory(data);

        if (version) {
          const vRes = await fetch(`/api/versions?type=stories`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (vRes.ok) {
            const manifest = await vRes.json();
            const vInfo = manifest.versions?.find((v: { version: string }) => v.version === version);
            setReadOnly(vInfo?.status === "published" || vInfo?.status === "archived");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load story");
      } finally {
        setLoading(false);
      }
    }
    fetchStory();
  }, [id, version]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-neutral-400">Loading story...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {readOnly ? "View" : "Edit"} Story
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          {readOnly ? "Viewing" : "Editing"}: {story?.title?.en || id} ({id}) — {story?.chapters?.length || 0} chapters
          {version && <span className="font-mono"> · v{version}</span>}
        </p>
      </div>
      {!readOnly && (
        <div className="mb-6">
          <TestGenerate
            type="story"
            id={id}
            chapterCount={story?.chapters?.length || 0}
          />
        </div>
      )}
      {story && (
        <StoryForm
          initialData={story}
          storyId={id}
          readOnly={readOnly}
          version={version}
        />
      )}
    </div>
  );
}
