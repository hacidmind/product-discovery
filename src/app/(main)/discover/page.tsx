"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Textarea, Button, Card, Badge, PriorityBadge, EmptyState, Select, Spinner, Modal, ConfirmDialog, useToast } from "@/components/ui";
import type { Insight, InsightSource, Emotion } from "@/lib/types";

const SOURCES: { value: InsightSource; label: string }[] = [
  { value: "customer_complaint", label: "Customer Complaint" },
  { value: "interview", label: "Interview Note" },
  { value: "feature_request", label: "Feature Request" },
  { value: "sales_feedback", label: "Sales Feedback" },
  { value: "support_ticket", label: "Support Ticket" },
  { value: "idea", label: "Idea" },
  { value: "other", label: "Other" },
];

const EMOTIONS: { value: Emotion | ""; label: string }[] = [
  { value: "", label: "All Emotions" },
  { value: "positive", label: "😊 Positive" },
  { value: "negative", label: "😟 Negative" },
  { value: "neutral", label: "😐 Neutral" },
  { value: "mixed", label: "🤔 Mixed" },
];

const emotionEmoji: Record<Emotion, string> = {
  positive: "😊",
  negative: "😟",
  neutral: "😐",
  mixed: "🤔",
};

export default function DiscoverPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<InsightSource>("customer_complaint");
  const [showForm, setShowForm] = useState(false);

  const [editingInsight, setEditingInsight] = useState<Insight | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editSource, setEditSource] = useState<InsightSource>("customer_complaint");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Insight | null>(null);
  const [sourceFilter, setSourceFilter] = useState<InsightSource | "">("");
  const [emotionFilter, setEmotionFilter] = useState<Emotion | "">("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch("/api/insights");
      if (!res.ok) throw new Error("Failed to fetch insights");
      const data = await res.json();
      setInsights(data);
      setError(null);
    } catch {
      setError("Failed to load insights. Check your connection.");
      toast.addToast("Failed to load insights", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const previousProductRef = useRef("");
  const loaded = useRef(false);
  useEffect(() => {
    const currentProduct = localStorage.getItem("active-product") || "";
    if (currentProduct !== previousProductRef.current) {
      previousProductRef.current = currentProduct;
      setLoading(true);
      fetchInsights();
    } else if (!loaded.current) {
      loaded.current = true;
      fetchInsights();
    }
  }, [fetchInsights]);
  useEffect(() => {
    const refresh = () => { setLoading(true); fetchInsights(); };
    window.addEventListener("active-product-changed", refresh);
    return () => window.removeEventListener("active-product-changed", refresh);
  }, [fetchInsights]);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, source }),
      });
      if (!res.ok) throw new Error("Failed to create insight");
      const insight = await res.json();
      setInsights((prev) => [insight, ...prev]);
      setDescription("");
      setShowForm(false);
      toast.addToast("Insight created successfully", "success");
    } catch {
      toast.addToast("Failed to create insight", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (insight: Insight) => setDeleteTarget(insight);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    try {
      const res = await fetch(`/api/insights/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setInsights((prev) => prev.filter((i) => i.id !== id));
      toast.addToast("Insight deleted", "success");
    } catch {
      toast.addToast("Failed to delete insight", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const openEdit = (insight: Insight) => {
    setEditingInsight(insight);
    setEditDescription(insight.description);
    setEditSource(insight.source);
  };

  const handleEditSave = async () => {
    if (!editingInsight || !editDescription.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/insights/${editingInsight.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editDescription, source: editSource }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setInsights((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      toast.addToast("Insight updated", "success");
      setEditingInsight(null);
    } catch {
      toast.addToast("Failed to update insight", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (showForm && description.trim()) handleSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm, description]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-3xl">⚠️</div>
        <p className="text-sm text-[var(--text-secondary)]">{error}</p>
        <Button variant="primary" size="sm" onClick={fetchInsights}>Retry</Button>
      </div>
    );
  }

  const filteredInsights = insights.filter((i) => {
    if (sourceFilter && i.source !== sourceFilter) return false;
    if (emotionFilter && i.emotion !== emotionFilter) return false;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto animate-fadein">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Problem Discovery</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Capture ideas, feedback, and complaints. The system analyzes them automatically.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Add Insight</Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Select
          value={sourceFilter}
          onChange={(v) => setSourceFilter(v as InsightSource | "")}
          options={[{ value: "", label: "All Sources" }, ...SOURCES]}
        />
        <Select
          value={emotionFilter}
          onChange={(v) => setEmotionFilter(v as Emotion | "")}
          options={EMOTIONS}
        />
      </div>

      {showForm && (
        <Card className="mb-6 p-4">
          <div className="flex items-center gap-3 mb-3">
            <Select
              value={source}
              onChange={(v) => setSource(v as InsightSource)}
              options={SOURCES}
            />
            <div className="text-xs text-[var(--text-tertiary)]">
              Press <kbd className="font-mono bg-[var(--bg-tertiary)] px-1 rounded">Ctrl+Enter</kbd> to submit
            </div>
          </div>
          <Textarea
            value={description}
            onChange={setDescription}
            placeholder="Paste an idea, customer complaint, interview note, or feature request..."
            minRows={4}
            autoFocus
          />
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-[var(--text-tertiary)]">
              The system will automatically extract keywords, detect themes, and analyze sentiment.
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!description.trim() || submitting}>
                {submitting ? <Spinner size={14} /> : "Analyze & Save"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {filteredInsights.length === 0 ? (
        <EmptyState
          icon="💡"
          title="No insights yet"
          description="Start by adding a customer complaint, feature request, or interview note."
          action={
            <Button onClick={() => setShowForm(true)}>+ Add Insight</Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredInsights.map((insight) => (
            <Card key={insight.id} className="p-4" onClick={() => openEdit(insight)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[var(--text-tertiary)] font-mono">
                      {new Date(insight.createdAt).toLocaleDateString()}
                    </span>
                    <Badge variant="default">{insight.source.replace(/_/g, " ")}</Badge>
                    <PriorityBadge priority={insight.priority} />
                    <span className="text-sm" title={insight.emotion}>
                      {emotionEmoji[insight.emotion]}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text)] line-clamp-3 whitespace-pre-wrap">
                    {insight.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {insight.tags.slice(0, 5).map((tag) => (
                      <Badge key={tag} variant="accent">{tag}</Badge>
                    ))}
                    {insight.themes.map((theme) => (
                      <Badge key={theme}>{theme}</Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    openDeleteConfirm(insight);
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={editingInsight !== null}
        onClose={() => setEditingInsight(null)}
        title="Edit Insight"
      >
        <div className="space-y-4">
          <Select
            value={editSource}
            onChange={(v) => setEditSource(v as InsightSource)}
            options={SOURCES}
          />
          <Textarea
            value={editDescription}
            onChange={setEditDescription}
            placeholder="Edit description..."
            minRows={4}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingInsight(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={!editDescription.trim() || savingEdit}>
              {savingEdit ? <Spinner size={14} /> : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Insight"
        message="Are you sure you want to delete this insight? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}