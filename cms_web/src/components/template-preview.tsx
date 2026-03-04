"use client";

interface PreviewData {
  name: Record<string, string | undefined>;
  category: string;
  type: string;
  gender: string;
  credits: number;
  badge: string;
  isPremium?: boolean;
  premium?: boolean;
  isActive: boolean;
  coverUrl?: string;
  coverImage?: string;
  aiConfig: {
    model: string;
    guidanceScale: number;
    aspectRatio?: string;
    aspectRatios?: string[];
  };
}

interface Props {
  data: PreviewData;
}

export function TemplatePreview({ data }: Props) {
  const isPremium = data.isPremium ?? data.premium ?? false;
  const coverUrl = data.coverUrl || "";
  const aspectRatio = data.aiConfig.aspectRatio || data.aiConfig.aspectRatios?.[0] || "1:1";

  return (
    <div className="w-full max-w-[280px]">
      {/* Card Preview (app-style) */}
      <div className="relative overflow-hidden rounded-2xl bg-bg-card">
        <div className="relative aspect-[3/4]">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={data.name.en || "Preview"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
              <svg className="h-12 w-12 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {data.badge && (
            <div className="absolute left-2 top-2">
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold uppercase text-black">
                {data.badge}
              </span>
            </div>
          )}

          {isPremium && (
            <div className="absolute right-2 top-2">
              <span className="rounded-full bg-purple-500/90 px-2 py-0.5 text-xs font-semibold text-white">
                PRO
              </span>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-3">
            <h4 className="text-sm font-semibold text-white">
              {data.name.en || "Template Name"}
            </h4>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-neutral-300 capitalize">
                {data.category}
              </span>
              {data.credits > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-brand">
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.95 5.95 0 01-.491-.921H10a1 1 0 100-2H7.938a7.468 7.468 0 010-1H10a1 1 0 100-2H8.245c.158-.332.347-.645.491-.921z" />
                  </svg>
                  {data.credits}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="mt-4 space-y-2 rounded-xl bg-bg-card p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">Type</span>
          <span className="capitalize text-neutral-300">{data.type}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">Gender</span>
          <span className="capitalize text-neutral-300">{data.gender}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">Model</span>
          <span className="font-mono text-neutral-300">
            {data.aiConfig.model.split("-").slice(0, 2).join("-")}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">Aspect Ratio</span>
          <span className="text-neutral-300">{aspectRatio}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">Guidance</span>
          <span className="text-neutral-300">{data.aiConfig.guidanceScale}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">Status</span>
          <span
            className={`font-medium ${
              data.isActive ? "text-green-400" : "text-neutral-600"
            }`}
          >
            {data.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* i18n Status */}
      <div className="mt-4 rounded-xl bg-bg-card p-4">
        <p className="mb-2 text-xs font-medium text-neutral-500">
          Translation Status
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(["en", "vi", "es", "pt", "ja", "ko"] as const).map((lang) => (
            <span
              key={lang}
              className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                data.name[lang]
                  ? "bg-green-500/10 text-green-400"
                  : "bg-neutral-800 text-neutral-600"
              }`}
            >
              {lang.toUpperCase()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
