"use client";

import { useState, useRef, useCallback } from "react";
import { Button, Card, Badge, Spinner, EmptyState, useToast } from "@/components/ui";

interface ImportSummary {
  totalInsights: number;
  totalOpportunities: number;
  totalPersonas: number;
  totalFeatures: number;
  totalAssumptions: number;
}

interface ImportItem {
  type: string;
  data: {
    id: string;
    title?: string;
    name?: string;
    statement?: string;
  };
}

interface ImportResult {
  success: boolean;
  savedCount: number;
  totalExtracted: number;
  summary: ImportSummary;
  items: ImportItem[];
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; variant: "accent" | "success" | "warning" | "danger" | "default" }> = {
  insight: { label: "Insight", icon: "\u25C6", variant: "accent" },
  opportunity: { label: "Opportunity", icon: "\u2726", variant: "success" },
  persona: { label: "Persona", icon: "\uD83D\uDC64", variant: "warning" },
  feature: { label: "Feature", icon: "\u26A1", variant: "danger" },
  assumption: { label: "Assumption", icon: "\u2753", variant: "default" },
};

function getItemLabel(item: ImportItem): string {
  return item.data.title || item.data.name || item.data.statement || "Untitled";
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleFile = useCallback((f: File) => {
    const validExtensions = [".txt", ".md", ".pdf", ".docx", ".json"];
    const ext = "." + f.name.split(".").pop()?.toLowerCase();

    if (!validExtensions.includes(ext)) {
      setError(`Unsupported file type. Please upload: ${validExtensions.join(", ")}`);
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }

    setFile(f);
    setError(null);
    setResult(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process document");
      }

      const data: ImportResult = await res.json();
      setResult(data);
      setReviewMode(true);
      addToast(`Imported ${data.savedCount} items successfully`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setReviewMode(false);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadein">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[var(--text)]">Import Document</h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Upload a research document, interview transcript, or product brief. The app will
          auto-extract insights, opportunities, personas, features, and assumptions from it.
        </p>
      </div>

      {!reviewMode && (
        <>
          <Card className="p-8">
            <div
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
                ${dragOver
                  ? "border-[var(--accent)] bg-[var(--accent-light)]"
                  : "border-[var(--border)] hover:border-[var(--accent)]"
                }
              `}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf,.docx,.json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="hidden"
              />

              {file ? (
                <div className="space-y-3">
                  <div className="text-3xl">\uD83D\uDCC4</div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{file.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button variant="ghost" size="xs" onClick={() => { handleReset(); }}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-3xl opacity-30">\u2B07\uFE0F</div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">
                      Drop your document here or click to browse
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      Supports .txt, .md, .pdf, .docx, .json
                    </p>
                  </div>
                </div>
              )}
            </div>

            {file && (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleUpload} disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner size={14} />
                      Processing...
                    </>
                  ) : (
                    "Analyze & Import"
                  )}
                </Button>
              </div>
            )}
          </Card>

          {error && (
            <div className="mt-4 p-3 rounded-[var(--radius)] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}

          <Card className="mt-6">
            <h2 className="text-sm font-medium text-[var(--text)] mb-3">What gets extracted</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Badge variant={config.variant}>
                    <span className="text-xs">{config.icon}</span> {config.label}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-3 leading-relaxed">
              The analysis engine scans your document for pain points, feature requests,
              opportunities, assumptions, and persona descriptions. It uses keyword detection
              and sentiment analysis to categorize and prioritize each extracted item.
              Structured .json files with existing data are imported directly.
            </p>
          </Card>
        </>
      )}

      {reviewMode && result && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">Import Results</h2>
              <Button variant="ghost" size="xs" onClick={handleReset}>
                Import Another
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                const count = (result.summary as unknown as Record<string, number>)[`total${key.charAt(0).toUpperCase() + key.slice(1)}s`] || 0;
                return (
                  <div key={key} className="text-center p-3 rounded-[var(--radius)] bg-[var(--bg-secondary)]">
                    <p className="text-lg font-semibold text-[var(--text)]">{count}</p>
                    <Badge variant={config.variant}>
                      <span className="text-xs">{config.icon}</span> {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>{result.savedCount} items saved to your workspace</span>
              <span>{result.totalExtracted} total items extracted from document</span>
            </div>
          </Card>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[var(--text)]">Extracted Items</h3>
            {result.items.length === 0 ? (
              <EmptyState
                icon="\uD83D\uDCC4"
                title="No items extracted"
                description="No recognizable content was found in the document. Try a document with clear sections and bullet points."
              />
            ) : (
              result.items.map((item, index) => {
                const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.insight;
                return (
                  <Card key={item.data.id || index} className="flex items-start gap-3">
                    <Badge variant={config.variant}>
                      <span className="text-xs">{config.icon}</span> {config.label}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text)] truncate">
                        {getItemLabel(item)}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {item.type === "insight" && "Added to Discover"}
                        {item.type === "opportunity" && "Added to Opportunities"}
                        {item.type === "persona" && "Added to Personas"}
                        {item.type === "feature" && "Added to Features"}
                        {item.type === "assumption" && "Added to Assumptions"}
                      </p>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}