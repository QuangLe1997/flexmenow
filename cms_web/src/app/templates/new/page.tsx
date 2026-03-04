"use client";

import { useSearchParams } from "next/navigation";
import { TemplateForm } from "@/components/template-form";

export default function NewTemplatePage() {
  const searchParams = useSearchParams();
  const version = searchParams.get("version") || undefined;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">New Template</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Create a new FlexShot template
          {version && <span className="font-mono"> · v{version}</span>}
        </p>
      </div>
      <TemplateForm version={version} />
    </div>
  );
}
