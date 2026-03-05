"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Engine = "gemini" | "gpu";

interface HistoryItem {
  id: number;
  engine: Engine;
  url: string;
  path: string;
  prompt?: string;
  timestamp: number;
}

interface Props {
  type: "template" | "story";
  id: string;
  chapterCount?: number;
}

export function TestGenerate({ type, id, chapterCount = 0 }: Props) {
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [inputPreview, setInputPreview] = useState<string>("");
  const [chapterIndex, setChapterIndex] = useState(0);
  const [engine, setEngine] = useState<Engine>("gemini");
  const [generating, setGenerating] = useState(false);
  const [gpuStatus, setGpuStatus] = useState("");
  const [result, setResult] = useState<{
    url: string;
    path: string;
    prompt?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Prompt history
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [compareIds, setCompareIds] = useState<[number | null, number | null]>([null, null]);
  const [showHistory, setShowHistory] = useState(false);
  const nextIdRef = useRef(1);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function handleFileSelect(file: File) {
    setInputFile(file);
    setResult(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setInputPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function addToHistory(item: Omit<HistoryItem, "id" | "timestamp">) {
    const newItem: HistoryItem = {
      ...item,
      id: nextIdRef.current++,
      timestamp: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev].slice(0, 20)); // Keep last 20
  }

  function toggleCompare(historyId: number) {
    setCompareIds((prev) => {
      if (prev[0] === historyId) return [null, prev[1]];
      if (prev[1] === historyId) return [prev[0], null];
      if (prev[0] === null) return [historyId, prev[1]];
      if (prev[1] === null) return [prev[0], historyId];
      return [historyId, prev[1]];
    });
  }

  const pollTaskStatus = useCallback(
    (taskId: string, token: string) => {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/generate-gpu/${taskId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();

          if (data.status === "done") {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            const resultData = {
              url: data.image_url,
              path: data.output_gcs_path,
            };
            setResult(resultData);
            addToHistory({ engine: "gpu", ...resultData });
            setGpuStatus("");
            setGenerating(false);
          } else if (data.status === "error") {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setError(data.error || "GPU generation failed");
            setGpuStatus("");
            setGenerating(false);
          } else {
            setGpuStatus(data.status);
          }
        } catch {
          // keep polling
        }
      }, 3000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  async function handleGenerate() {
    if (!inputFile) {
      setError("Please select a face photo first");
      return;
    }

    setGenerating(true);
    setError("");
    setResult(null);
    setGpuStatus("");

    try {
      const token = localStorage.getItem("adminToken") || "";
      const formData = new FormData();
      formData.append("inputImage", inputFile);
      formData.append("type", type);
      formData.append("id", id);
      if (type === "story") {
        formData.append("chapterIndex", chapterIndex.toString());
      }

      if (engine === "gemini") {
        // Direct Gemini generation (synchronous)
        const res = await fetch("/api/test-generate", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResult(data);
        addToHistory({ engine: "gemini", url: data.url, path: data.path, prompt: data.prompt });
        setGenerating(false);
      } else {
        // GPU service via Pub/Sub (async with polling)
        formData.append("model", "zimage");
        const res = await fetch("/api/generate-gpu", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setGpuStatus("queued");
        pollTaskStatus(data.task_id, token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setGenerating(false);
    }
  }

  const compareItems = compareIds
    .map((cid) => history.find((h) => h.id === cid))
    .filter(Boolean) as HistoryItem[];

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
          Test Generate
        </h3>
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            History ({history.length})
          </button>
        )}
      </div>

      {/* Engine selector */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setEngine("gemini")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            engine === "gemini"
              ? "bg-blue-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:text-white"
          }`}
        >
          Gemini AI
        </button>
        <button
          onClick={() => setEngine("gpu")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            engine === "gpu"
              ? "bg-purple-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:text-white"
          }`}
        >
          GPU Service
        </button>
      </div>

      {/* Input Image */}
      <div className="flex items-start gap-4 mb-4">
        <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-700 bg-bg-elevated transition-colors hover:border-brand/50 flex-shrink-0">
          {inputPreview ? (
            <img
              src={inputPreview}
              alt="Input"
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <>
              <svg
                className="mb-1 h-5 w-5 text-neutral-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-xs text-neutral-500">Face</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </label>

        <div className="flex-1 space-y-3">
          <p className="text-xs text-neutral-400">
            Upload a face photo to test AI generation with this {type}&apos;s
            prompt.
            {engine === "gpu"
              ? " Task will be sent to GPU service via Pub/Sub."
              : " Output will be saved as the preview image."}
          </p>

          {type === "story" && chapterCount > 0 && (
            <div>
              <label className="label">Chapter</label>
              <select
                value={chapterIndex}
                onChange={(e) => setChapterIndex(parseInt(e.target.value))}
                className="select w-auto"
              >
                {Array.from({ length: chapterCount }, (_, i) => (
                  <option key={i} value={i}>
                    Chapter {i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || !inputFile}
            className="btn-primary text-sm"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {gpuStatus
                  ? `GPU: ${gpuStatus}...`
                  : "Generating..."}
              </span>
            ) : engine === "gpu" ? (
              "Send to GPU"
            ) : (
              "Generate & Save Preview"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
            Saved to: {result.path}
          </div>
          <img
            src={result.url}
            alt="Generated"
            className="w-full max-w-sm rounded-lg"
          />
          {result.prompt && (
            <p className="text-xs text-neutral-500 break-all">
              {result.prompt}
            </p>
          )}
        </div>
      )}

      {/* Prompt History */}
      {showHistory && history.length > 0 && (
        <div className="mt-4 border-t border-neutral-800 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Generation History
            </h4>
            {compareItems.length === 2 && (
              <span className="text-xs text-brand">Comparing 2 results</span>
            )}
          </div>

          {/* Side-by-side compare */}
          {compareItems.length === 2 && (
            <div className="mb-4 grid grid-cols-2 gap-3">
              {compareItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-neutral-700 p-2">
                  <img
                    src={item.url}
                    alt={`Result #${item.id}`}
                    className="w-full rounded-lg"
                  />
                  <div className="mt-2 text-xs text-neutral-400">
                    <span className={item.engine === "gemini" ? "text-blue-400" : "text-purple-400"}>
                      {item.engine}
                    </span>
                    {" · "}
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                  {item.prompt && (
                    <p className="mt-1 text-[10px] text-neutral-500 line-clamp-3">
                      {item.prompt}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* History list */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {history.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
                  compareIds.includes(item.id)
                    ? "bg-brand/10 border border-brand/30"
                    : "bg-neutral-800/50 hover:bg-neutral-800"
                }`}
              >
                <img
                  src={item.url}
                  alt={`#${item.id}`}
                  className="h-12 w-12 rounded object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={item.engine === "gemini" ? "text-blue-400" : "text-purple-400"}>
                      {item.engine}
                    </span>
                    <span className="text-neutral-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {item.prompt && (
                    <p className="text-[10px] text-neutral-500 truncate">
                      {item.prompt}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleCompare(item.id)}
                  className={`shrink-0 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                    compareIds.includes(item.id)
                      ? "bg-brand text-black"
                      : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
                  }`}
                >
                  {compareIds.includes(item.id) ? "Selected" : "Compare"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
