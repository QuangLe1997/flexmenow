"use client";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: "templates" | "stories";
  count: number;
  version: string;
  publishing: boolean;
  targetVersion?: string;
}

export function PublishDialog({
  open, onClose, onConfirm, type, count, version, publishing, targetVersion,
}: Props) {
  if (!open) return null;

  const jsonFile = type === "templates"
    ? "config/flexshot_templates.json"
    : "config/flextale_stories.json";
  const rcKey = type === "templates"
    ? "flexshot_json_url"
    : "flextale_json_url";

  const isVersionPublish = targetVersion && targetVersion !== version;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4">
          Publish {type === "templates" ? "Templates" : "Stories"}?
        </h2>

        <div className="space-y-3 rounded-xl bg-bg-elevated p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-400">Items</span>
            <span className="text-white font-medium">{count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Version</span>
            <span className="text-white font-mono">
              {isVersionPublish ? (
                <>v{targetVersion} &rarr; published <span className="text-neutral-500">(replaces v{version})</span></>
              ) : (
                <>{version} &rarr; next</>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">GCS File</span>
            <span className="text-neutral-300 text-xs">{jsonFile}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Remote Config</span>
            <span className="text-neutral-300 text-xs">{rcKey}</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-500">
          {isVersionPublish
            ? `This will promote v${targetVersion} to published, copy its JSON to the canonical file, and push a cache-busting URL to Remote Config. The current published version (v${version}) will be archived.`
            : "This will upload the updated JSON to GCS and push a cache-busting URL to Remote Config. The mobile app will fetch the new data on next launch."
          }
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={publishing}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={publishing}
            className="btn-primary"
          >
            {publishing ? "Publishing..." : isVersionPublish ? `Publish v${targetVersion}` : "Publish Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
