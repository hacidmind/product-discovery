"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Textarea, Button, Card, Badge, PriorityBadge, EmptyState, Modal, Select, ScoreSlider, Spinner } from "@/components/ui";
import type { Feature, Framework, MoSCoW, KanoCategory } from "@/lib/types";

const FRAMEWORKS: { value: Framework; label: string; description: string }[] = [
  { value: "rice", label: "RICE", description: "Reach × Impact × Confidence / Effort" },
  { value: "ice", label: "ICE", description: "Impact + Confidence + Ease" },
  { value: "moscow", label: "MoSCoW", description: "Must / Should / Could / Won't" },
  { value: "kano", label: "Kano", description: "Basic / Performance / Delight" },
  { value: "weighted", label: "Weighted", description: "Custom weight scoring" },
];

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [framework, setFramework] = useState<Framework>("rice");
  const [sortKey, setSortKey] = useState<"totalScore" | "createdAt">("totalScore");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // RICE
  const [reach, setReach] = useState(5);
  const [impact, setImpact] = useState(6);
  const [confidence, setConfidence] = useState(7);
  const [effort, setEffort] = useState(5);

  // ICE
  const [iceImpact, setIceImpact] = useState(6);
  const [iceConfidence, setIceConfidence] = useState(7);
  const [iceEase, setIceEase] = useState(5);

  // MoSCoW
  const [moscow, setMoscow] = useState<MoSCoW>("should");

  // Kano
  const [kano, setKano] = useState<KanoCategory>("performance");

  // Weighted
  const [weightReach, setWeightReach] = useState(1);
  const [weightImpact, setWeightImpact] = useState(2);
  const [weightConfidence, setWeightConfidence] = useState(1);
  const [weightEffort, setWeightEffort] = useState(1);

  const fetchFeatures = useCallback(async () => {
    const res = await fetch("/api/features");
    const data = await res.json();
    setFeatures(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  const previousProductRef = useRef("");
  const loaded = useRef(false);
  useEffect(() => {
    const currentProduct = localStorage.getItem("active-product") || "";
    if (currentProduct !== previousProductRef.current) {
      previousProductRef.current = currentProduct;
      setLoading(true);
      fetchFeatures();
    } else if (!loaded.current) {
      loaded.current = true;
      fetchFeatures();
    }
  }, [fetchFeatures]);
  useEffect(() => {
    const refresh = () => { setLoading(true); fetchFeatures(); };
    window.addEventListener("active-product-changed", refresh);
    return () => window.removeEventListener("active-product-changed", refresh);
  }, [fetchFeatures]);

  const handleCreate = async () => {
    if (!title.trim()) return;

    let scores: Record<string, unknown> = {};
    if (framework === "rice") scores = { reach, impact, confidence, effort };
    else if (framework === "ice") scores = { iceImpact, iceConfidence, iceEase };
    else if (framework === "moscow") scores = { moscow };
    else if (framework === "kano") scores = { kano };
    else if (framework === "weighted") scores = {
      reach, impact, confidence, effort,
      weights: { reach: weightReach, impact: weightImpact, confidence: weightConfidence, effort: weightEffort },
    };

    const res = await fetch("/api/features", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, framework, scores }),
    });

    const feature = await res.json();
    setFeatures((prev) => [feature, ...prev]);
    setShowCreate(false);
    setTitle("");
    setDescription("");
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch("/api/features", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setFeatures((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: status as Feature["status"] } : f))
      );
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/features/${id}`, { method: "DELETE" });
    if (res.ok) {
      setFeatures((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const sortedFeatures = [...features].sort((a, b) => {
    if (sortKey === "totalScore") return b.totalScore - a.totalScore;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const liveScorePreview = () => {
    if (framework === "rice") {
      if (effort === 0) return 0;
      return Math.round(((reach * impact * confidence) / effort) * 100) / 100;
    }
    if (framework === "ice") return Math.round(((iceImpact + iceConfidence + iceEase) / 3) * 100) / 100;
    if (framework === "moscow") {
      const s: Record<string, number> = { must: 10, should: 7, could: 4, wont: 1 };
      return s[moscow];
    }
    if (framework === "kano") {
      const s: Record<string, number> = { basic: 8, performance: 6, delight: 4, indifferent: 2, reverse: 1 };
      return s[kano];
    }
    const totalWeight = weightReach + weightImpact + weightConfidence + weightEffort;
    if (totalWeight === 0) return 0;
    return Math.round(((reach * weightReach + impact * weightImpact + confidence * weightConfidence + effort * weightEffort) / totalWeight) * 100) / 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadein">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Feature Prioritization</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Score features using RICE, ICE, MoSCoW, Kano, or Weighted Scoring.
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
          <Button onClick={() => setShowCreate(true)}>+ New Feature</Button>
        </div>
      </div>

      {features.length === 0 ? (
        <EmptyState
          icon="⚡"
          title="No features yet"
          description="Add features and prioritize them using your framework of choice."
          action={<Button onClick={() => setShowCreate(true)}>+ New Feature</Button>}
        />
      ) : (
        <div className="space-y-3">
          {sortedFeatures.map((feature) => (
            <Card key={feature.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{feature.title}</span>
                    <Badge variant="accent">{feature.framework.toUpperCase()}</Badge>
                    <PriorityBadge priority={feature.priority} />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-2">
                    {feature.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min((feature.totalScore / 10) * 100, 100)}%`,
                          background:
                            feature.totalScore >= 7.5 ? "var(--danger)" :
                              feature.totalScore >= 5.5 ? "var(--warning)" : "var(--accent)",
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono font-semibold w-10 text-right">{feature.totalScore}</span>
                    <Select
                      value={feature.status}
                      onChange={(v) => updateStatus(feature.id, v)}
                      options={[
                        { value: "backlog", label: "Backlog" },
                        { value: "next", label: "Up Next" },
                        { value: "in_progress", label: "In Progress" },
                        { value: "done", label: "Done" },
                      ]}
                      className="text-xs py-0.5"
                    />
                  </div>
                </div>
                <Button variant="ghost" size="xs" onClick={() => handleDelete(feature.id)}>
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Feature">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Real-time collaboration"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                  text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Framework</label>
              <Select
                value={framework}
                onChange={(v) => setFramework(v as Framework)}
                options={FRAMEWORKS.map((f) => ({ value: f.value, label: f.label }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Description</label>
            <Textarea value={description} onChange={setDescription} placeholder="What is this feature?" minRows={2} />
          </div>

          <p className="text-xs text-[var(--text-tertiary)]">
            {FRAMEWORKS.find((f) => f.value === framework)?.description}
          </p>

          {/* Framework-specific inputs */}
          {(framework === "rice" || framework === "weighted") && (
            <div className="space-y-2">
              <ScoreSlider label="Reach" value={reach} onChange={setReach} />
              <ScoreSlider label="Impact" value={impact} onChange={setImpact} />
              <ScoreSlider label="Confidence" value={confidence} onChange={setConfidence} />
              <ScoreSlider label="Effort" value={effort} onChange={setEffort} />
            </div>
          )}

          {framework === "ice" && (
            <div className="space-y-2">
              <ScoreSlider label="Impact" value={iceImpact} onChange={setIceImpact} />
              <ScoreSlider label="Confidence" value={iceConfidence} onChange={setIceConfidence} />
              <ScoreSlider label="Ease" value={iceEase} onChange={setIceEase} />
            </div>
          )}

          {framework === "moscow" && (
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {(["must", "should", "could", "wont"] as MoSCoW[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMoscow(m)}
                    className={`px-3 py-2 rounded-[var(--radius)] text-sm border transition-colors
                      ${moscow === m
                        ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                      }`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)} have
                  </button>
                ))}
              </div>
            </div>
          )}

          {framework === "kano" && (
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {(["basic", "performance", "delight", "indifferent", "reverse"] as KanoCategory[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setKano(k)}
                    className={`px-3 py-2 rounded-[var(--radius)] text-sm border transition-colors
                      ${kano === k
                        ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                      }`}
                  >
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {framework === "weighted" && (
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-2">Weights</label>
              <ScoreSlider label="Reach weight" value={weightReach} onChange={setWeightReach} max={5} />
              <ScoreSlider label="Impact weight" value={weightImpact} onChange={setWeightImpact} max={5} />
              <ScoreSlider label="Confidence weight" value={weightConfidence} onChange={setWeightConfidence} max={5} />
              <ScoreSlider label="Effort weight" value={weightEffort} onChange={setWeightEffort} max={5} />
            </div>
          )}

          {/* Live score */}
          <div className="bg-[var(--bg-secondary)] rounded-[var(--radius)] p-3">
            <div className="text-xs text-[var(--text-secondary)] mb-1">Estimated Score</div>
            <div className="text-lg font-bold font-mono">{liveScorePreview()} / 10</div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!title.trim()}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}