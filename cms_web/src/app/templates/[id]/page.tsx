"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { TemplateForm } from "@/components/template-form";
import { TestGenerate } from "@/components/test-generate";
import type { TemplateItem } from "@/lib/types";

export default function EditTemplatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const version = searchParams.get("version") || undefined;
  const [template, setTemplate] = useState<TemplateItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readOnly, setReadOnly] = useState(false);

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const token = localStorage.getItem("adminToken") || "";
        const vParam = version ? `?version=${version}` : "";
        const res = await fetch(`/api/templates/${id}${vParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch template");
        const data = await res.json();
        setTemplate(data);

        // Check if version is read-only
        if (version) {
          const vRes = await fetch(`/api/versions?type=templates`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (vRes.ok) {
            const manifest = await vRes.json();
            const vInfo = manifest.versions?.find((v: { version: string }) => v.version === version);
            setReadOnly(vInfo?.status === "published" || vInfo?.status === "archived");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load template");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplate();
  }, [id, version]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-neutral-400">Loading template...</div>
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
          {readOnly ? "View" : "Edit"} Template
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          {readOnly ? "Viewing" : "Editing"}: {template?.name?.en || id} ({id})
          {version && <span className="font-mono"> · v{version}</span>}
        </p>
      </div>
      {!readOnly && (
        <div className="mb-6">
          <TestGenerate type="template" id={id} />
        </div>
      )}
      {template && (
        <TemplateForm
          initialData={template}
          templateId={id}
          readOnly={readOnly}
          version={version}
        />
      )}
    </div>
  );
}
