"use client";

import { useSearchParams } from "next/navigation";
import { StoryForm } from "@/components/story-form";

export default function NewStoryPage() {
  const searchParams = useSearchParams();
  const version = searchParams.get("version") || undefined;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">New Story</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Create a new FlexTale story
          {version && <span className="font-mono"> · v{version}</span>}
        </p>
      </div>
      <StoryForm version={version} />
    </div>
  );
}
