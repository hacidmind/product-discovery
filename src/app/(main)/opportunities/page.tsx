"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Textarea, Button, Card, Badge, PriorityBadge, EmptyState, Modal, ScoreSlider, Spinner, Select, ConfirmDialog, useToast } from "@/components/ui";
import ProgressiveList from "@/components/progressive-list";
import type { Insight, Opportunity, OpportunityScore } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "exploring", label: "Exploring" },
  { value: "validated", label: "Validated" },
  { value: "building", label: "Building" },
  { value: "shipped", label: "Shipped" },
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showInsightPicker, setShowInsightPicker] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [sortKey, setSortKey] = useState<"totalScore" | "createdAt">("totalScore");
  const toast = useToast();
  const pickerScrollRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scores, setScores] = useState<OpportunityScore>({
    impact: 5, frequency: 5, urgency: 5, businessValue: 5, strategicAlignment: 5, confidence: 5,
  });

  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await fetch("/api/opportunities");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOpportunities(data);
      setError(null);
    } catch {
      setError("Failed to load opportunities.");
      toast.addToast("Failed to load opportunities", "error");
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
      fetchOpportunities();
    } else if (!loaded.current) {
      loaded.current = true;
      fetchOpportunities();
    }
  }, [fetchOpportunities]);
  useEffect(() => {
    const refresh = () => { setLoading(true); fetchOpportunities(); };
    window.addEventListener("active-product-changed", refresh);
    return () => window.removeEventListener("active-product-changed", refresh);
  }, [fetchOpportunities]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, scores }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const opp = await res.json();
      setOpportunities((prev) => [opp, ...prev]);
      setShowCreate(false);
      setTitle(""); setDescription("");
      setScores({ impact: 5, frequency: 5, urgency: 5, businessValue: 5, strategicAlignment: 5, confidence: 5 });
      toast.addToast("Opportunity created", "success");
    } catch {
      toast.addToast("Failed to create opportunity", "error");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, status: status as Opportunity["status"] } : o)));
        toast.addToast("Status updated", "success");
      } else {
        toast.addToast("Failed to update status", "error");
      }
    } catch {
      toast.addToast("Failed to update status", "error");
    }
  };

  const handleEdit = async () => {
    if (!editingOpp || !editingOpp.title.trim()) return;
    try {
      const res = await fetch(`/api/opportunities/${editingOpp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editingOpp.title, description: editingOpp.description, scores: editingOpp.scores }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        setShowEdit(false); setEditingOpp(null);
        toast.addToast("Opportunity updated", "success");
      } else {
        toast.addToast("Failed to update", "error");
      }
    } catch {
      toast.addToast("Failed to update", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/opportunities/${deletingId}`, { method: "DELETE" });
      if (res.ok) {
        setOpportunities((prev) => prev.filter((o) => o.id !== deletingId));
        toast.addToast("Opportunity deleted", "success");
      }
    } catch {
      toast.addToast("Failed to delete", "error");
    } finally {
      setShowDelete(false); setDeletingId(null);
    }
  };

  const openInsightPicker = async () => {
    try {
      const res = await fetch("/api/insights");
      const data = await res.json();
      setInsights(Array.isArray(data) ? data : []);
      setShowInsightPicker(true);
    } catch {
      toast.addToast("Failed to load insights", "error");
    }
  };

  const prefillFromInsight = (insight: Insight) => {
    setTitle(insight.title);
    setDescription(insight.description);
    setShowInsightPicker(false);
    setShowCreate(true);
  };

  const calcLiveScore = (s: OpportunityScore) =>
    Math.round(((s.impact * 0.25 + s.frequency * 0.20 + s.urgency * 0.15 + s.businessValue * 0.20 + s.strategicAlignment * 0.20) * (s.confidence / 10)) * 10) / 10;

  const sortedOpportunities = [...opportunities].sort((a, b) => {
    if (sortKey === "totalScore") return b.totalScore - a.totalScore;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-3xl">⚠️</div>
        <p className="text-sm text-[var(--text-secondary)]">{error}</p>
        <Button variant="primary" size="sm" onClick={fetchOpportunities}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fadein">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Opportunities</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Score and prioritize opportunities using a transparent framework.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={sortKey}
            onChange={(v) => setSortKey(v as typeof sortKey)}
            options={[
              { value: "totalScore", label: "Sort by Score" },
              { value: "createdAt", label: "Sort by Date" },
            ]}
          />
          <Button variant="secondary" size="sm" onClick={openInsightPicker}>+ From Insight</Button>
          <Button onClick={() => setShowCreate(true)}>+ New Opportunity</Button>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <EmptyState
          icon="◆"
          title="No opportunities yet"
          description="Create an opportunity and score it across impact, frequency, urgency, business value, and strategic alignment."
          action={<Button onClick={() => setShowCreate(true)}>+ New Opportunity</Button>}
        />
      ) : (
        <ProgressiveList
          items={sortedOpportunities}
          className="space-y-3"
          renderItem={(opp) => (
            <Card key={opp.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{opp.title}</span>
                    <PriorityBadge priority={opp.priority} />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-2">{opp.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(opp.totalScore / 10) * 100}%`,
                          background: opp.totalScore >= 7.5 ? "var(--danger)" : opp.totalScore >= 5.5 ? "var(--warning)" : opp.totalScore >= 3.5 ? "var(--accent)" : "var(--text-tertiary)",
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono font-semibold w-10 text-right">{opp.totalScore}</span>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)]">{opp.reasoning}</p>
                  <Select
                    value={opp.status}
                    onChange={(v) => updateStatus(opp.id, v)}
                    options={STATUS_OPTIONS}
                    className="text-xs py-0.5 mt-2"
                  />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingOpp(opp); setShowEdit(true); }}
                    className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                    aria-label="Edit"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </button>
                  <Button variant="ghost" size="xs" onClick={() => { setDeletingId(opp.id); setShowDelete(true); }}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </Button>
                </div>
              </div>
            </Card>
          )}
        />
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Opportunity">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Reduce onboarding time for new users"
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Description</label>
            <Textarea value={description} onChange={setDescription} placeholder="What is this opportunity?" minRows={3} />
          </div>
          <div className="border-t pt-3">
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-3">Opportunity Scoring (1-10)</label>
            <div className="space-y-2">
              <ScoreSlider label="Impact" value={scores.impact} onChange={(v) => setScores((p) => ({ ...p, impact: v }))} />
              <ScoreSlider label="Frequency" value={scores.frequency} onChange={(v) => setScores((p) => ({ ...p, frequency: v }))} />
              <ScoreSlider label="Urgency" value={scores.urgency} onChange={(v) => setScores((p) => ({ ...p, urgency: v }))} />
              <ScoreSlider label="Business Value" value={scores.businessValue} onChange={(v) => setScores((p) => ({ ...p, businessValue: v }))} />
              <ScoreSlider label="Strategic Alignment" value={scores.strategicAlignment} onChange={(v) => setScores((p) => ({ ...p, strategicAlignment: v }))} />
              <ScoreSlider label="Confidence" value={scores.confidence} onChange={(v) => setScores((p) => ({ ...p, confidence: v }))} />
            </div>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-[var(--radius)] p-3">
            <div className="text-xs text-[var(--text-secondary)] mb-1">Estimated Score</div>
            <div className="text-lg font-bold font-mono">{calcLiveScore(scores)} / 10</div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!title.trim()}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showEdit} onClose={() => { setShowEdit(false); setEditingOpp(null); }} title="Edit Opportunity">
        {editingOpp && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Title</label>
              <input
                value={editingOpp.title}
                onChange={(e) => setEditingOpp({ ...editingOpp, title: e.target.value })}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Description</label>
              <Textarea value={editingOpp.description} onChange={(v) => setEditingOpp({ ...editingOpp, description: v })} minRows={3} />
            </div>
            <div className="border-t pt-3">
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-3">Opportunity Scoring (1-10)</label>
              <div className="space-y-2">
                <ScoreSlider label="Impact" value={editingOpp.scores.impact} onChange={(v) => setEditingOpp({ ...editingOpp, scores: { ...editingOpp.scores, impact: v } })} />
                <ScoreSlider label="Frequency" value={editingOpp.scores.frequency} onChange={(v) => setEditingOpp({ ...editingOpp, scores: { ...editingOpp.scores, frequency: v } })} />
                <ScoreSlider label="Urgency" value={editingOpp.scores.urgency} onChange={(v) => setEditingOpp({ ...editingOpp, scores: { ...editingOpp.scores, urgency: v } })} />
                <ScoreSlider label="Business Value" value={editingOpp.scores.businessValue} onChange={(v) => setEditingOpp({ ...editingOpp, scores: { ...editingOpp.scores, businessValue: v } })} />
                <ScoreSlider label="Strategic Alignment" value={editingOpp.scores.strategicAlignment} onChange={(v) => setEditingOpp({ ...editingOpp, scores: { ...editingOpp.scores, strategicAlignment: v } })} />
                <ScoreSlider label="Confidence" value={editingOpp.scores.confidence} onChange={(v) => setEditingOpp({ ...editingOpp, scores: { ...editingOpp.scores, confidence: v } })} />
              </div>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-[var(--radius)] p-3">
              <div className="text-xs text-[var(--text-secondary)] mb-1">Estimated Score</div>
              <div className="text-lg font-bold font-mono">{calcLiveScore(editingOpp.scores)} / 10</div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => { setShowEdit(false); setEditingOpp(null); }}>Cancel</Button>
              <Button onClick={handleEdit} disabled={!editingOpp.title.trim()}>Save</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showInsightPicker} onClose={() => setShowInsightPicker(false)} title="Create Opportunity from Insight">
        <div ref={pickerScrollRef} className="space-y-3 max-h-96 overflow-y-auto">
          {insights.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)]">No insights available.</p>
          ) : (
            <ProgressiveList
              items={insights}
              className="space-y-3"
              scrollRef={pickerScrollRef}
              renderItem={(insight) => (
                <Card key={insight.id} className="p-3 cursor-pointer hover:border-[var(--accent)]" onClick={() => prefillFromInsight(insight)}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5">{insight.description}</p>
                    </div>
                    <Badge variant="default">{insight.source}</Badge>
                  </div>
                </Card>
              )}
            />
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={showDelete}
        onClose={() => { setShowDelete(false); setDeletingId(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Opportunity"
        message="Are you sure you want to delete this opportunity? This action cannot be undone."
      />
    </div>
  );
}