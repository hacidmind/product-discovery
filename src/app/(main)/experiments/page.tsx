"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Card, Badge, EmptyState, Modal, Spinner, Select } from "@/components/ui";
import type { Experiment, ExperimentStatus } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "accent" | "success" }> = {
  planned: { label: "Planned", variant: "default" },
  running: { label: "Running", variant: "accent" },
  completed: { label: "Completed", variant: "success" },
};

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [successMetric, setSuccessMetric] = useState("");
  const [failureMetric, setFailureMetric] = useState("");
  const [duration, setDuration] = useState("1 week");
  const [cost, setCost] = useState("Low");
  const [risk, setRisk] = useState<"low" | "medium" | "high">("low");
  const [expectedLearning, setExpectedLearning] = useState("");
  const [results, setResults] = useState("");

  const fetchExperiments = useCallback(async () => {
    const res = await fetch("/api/experiments");
    const data = await res.json();
    setExperiments(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  const previousProductRef = useRef("");
  const loaded = useRef(false);
  useEffect(() => {
    const currentProduct = localStorage.getItem("active-product") || "";
    if (currentProduct !== previousProductRef.current) {
      previousProductRef.current = currentProduct;
      setLoading(true);
      fetchExperiments();
    } else if (!loaded.current) {
      loaded.current = true;
      fetchExperiments();
    }
  }, [fetchExperiments]);
  useEffect(() => {
    const refresh = () => { setLoading(true); fetchExperiments(); };
    window.addEventListener("active-product-changed", refresh);
    return () => window.removeEventListener("active-product-changed", refresh);
  }, [fetchExperiments]);

  const handleCreate = async () => {
    if (!title.trim()) return;

    const res = await fetch("/api/experiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        hypothesis,
        metrics: { successMetric, failureMetric },
        duration,
        cost,
        risk,
        expectedLearning,
        results,
      }),
    });

    const experiment = await res.json();
    setExperiments((prev) => [experiment, ...prev]);
    setTitle("");
    setHypothesis("");
    setSuccessMetric("");
    setFailureMetric("");
    setDuration("1 week");
    setCost("Low");
    setRisk("low");
    setExpectedLearning("");
    setResults("");
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/experiments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setExperiments((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const updateStatus = async (id: string, status: ExperimentStatus) => {
    const res = await fetch(`/api/experiments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setExperiments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status } : e))
      );
    }
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
          <h1 className="text-lg font-semibold tracking-tight">Experiments</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Design experiments to validate your riskiest assumptions.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Experiment</Button>
      </div>

      {experiments.length === 0 ? (
        <EmptyState
          icon="🔬"
          title="No experiments yet"
          description="Create experiments to test your assumptions. Each experiment includes a hypothesis, success/failure metrics, and expected learning."
          action={<Button onClick={() => setShowCreate(true)}>+ New Experiment</Button>}
        />
      ) : (
        <div className="space-y-3">
          {experiments.map((exp) => {
            const statusCfg = STATUS_CONFIG[exp.status];
            return (
              <Card key={exp.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{exp.title}</span>
                      <Badge variant={statusCfg.variant as "default" | "accent" | "success"}>
                        {statusCfg.label}
                      </Badge>
                      <Badge variant={exp.risk === "high" ? "danger" : exp.risk === "medium" ? "warning" : "default"}>
                        {exp.risk} risk
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] italic mb-2">
                      {exp.hypothesis}
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-[var(--text-secondary)]">
                      <div>
                        <span className="text-[var(--success)] font-medium">Success:</span> {exp.metrics.successMetric}
                      </div>
                      <div>
                        <span className="text-[var(--danger)] font-medium">Failure:</span> {exp.metrics.failureMetric}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {exp.duration}
                      </div>
                      <div>
                        <span className="font-medium">Cost:</span> {exp.cost}
                      </div>
                    </div>
                    {exp.expectedLearning && (
                      <p className="text-xs text-[var(--text-secondary)] mt-2">
                        <span className="font-medium">Expected learning:</span> {exp.expectedLearning}
                      </p>
                    )}
                    {exp.results && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        <span className="font-medium">Results:</span> {exp.results}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Select
                        value={exp.status}
                        onChange={(v) => updateStatus(exp.id, v as ExperimentStatus)}
                        options={[
                          { value: "planned", label: "Planned" },
                          { value: "running", label: "Running" },
                          { value: "completed", label: "Completed" },
                        ]}
                        className="text-xs py-0.5"
                      />
                    </div>
                  </div>
                  <Button variant="ghost" size="xs" onClick={() => handleDelete(exp.id)}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Experiment">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Landing page smoke test for new feature"
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Hypothesis</label>
            <input
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="We believe that... [feature/change] will result in... [expected impact]"
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Success Metric</label>
              <input
                value={successMetric}
                onChange={(e) => setSuccessMetric(e.target.value)}
                placeholder="e.g. 20% conversion rate"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                  text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Failure Metric</label>
              <input
                value={failureMetric}
                onChange={(e) => setFailureMetric(e.target.value)}
                placeholder="e.g. Below 5% conversion rate"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                  text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Duration</label>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 2 weeks"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                  text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Cost</label>
              <input
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g. $500"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                  text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Risk</label>
              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value as "low" | "medium" | "high")}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                  text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Expected Learning</label>
            <input
              value={expectedLearning}
              onChange={(e) => setExpectedLearning(e.target.value)}
              placeholder="What do you expect to learn from this experiment?"
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Results (optional)</label>
            <input
              value={results}
              onChange={(e) => setResults(e.target.value)}
              placeholder="Record experiment outcomes here"
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
            />
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