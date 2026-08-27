"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Card, Badge, EmptyState, Modal, Spinner } from "@/components/ui";
import type { Assumption, AssumptionArea } from "@/lib/types";

const AREA_CONFIG: Record<AssumptionArea, { label: string; color: string; emoji: string }> = {
  desirability: { label: "Desirability", color: "text-blue-500", emoji: "❤️" },
  feasibility: { label: "Feasibility", color: "text-purple-500", emoji: "🔧" },
  viability: { label: "Viability", color: "text-green-500", emoji: "💰" },
  usability: { label: "Usability", color: "text-orange-500", emoji: "🖐️" },
  risk: { label: "Risk", color: "text-red-500", emoji: "⚠️" },
  unknown: { label: "Unknown", color: "text-gray-500", emoji: "❔" },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "accent" | "success" | "danger" }> = {
  untested: { label: "Untested", variant: "default" },
  testing: { label: "Testing", variant: "accent" },
  validated: { label: "Validated", variant: "success" },
  invalidated: { label: "Invalidated", variant: "danger" },
};

const RISK_CONFIG: Record<string, { label: string; variant: "default" | "warning" | "danger" }> = {
  low: { label: "Low Risk", variant: "default" },
  medium: { label: "Medium Risk", variant: "warning" },
  high: { label: "High Risk", variant: "danger" },
  critical: { label: "Critical Risk", variant: "danger" },
};

export default function AssumptionsPage() {
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedArea, setSelectedArea] = useState<AssumptionArea | "all">("all");

  // Form
  const [statement, setStatement] = useState("");
  const [evidence, setEvidence] = useState("");

  const fetchAssumptions = useCallback(async () => {
    const res = await fetch("/api/assumptions");
    const data = await res.json();
    setAssumptions(data);
    setLoading(false);
  }, []);

  const previousProductRef = useRef("");
  const loaded = useRef(false);
  useEffect(() => {
    const currentProduct = localStorage.getItem("active-product") || "";
    if (currentProduct !== previousProductRef.current) {
      previousProductRef.current = currentProduct;
      setLoading(true);
      fetchAssumptions();
    } else if (!loaded.current) {
      loaded.current = true;
      fetchAssumptions();
    }
  }, [fetchAssumptions]);
  useEffect(() => {
    const refresh = () => { setLoading(true); fetchAssumptions(); };
    window.addEventListener("active-product-changed", refresh);
    return () => window.removeEventListener("active-product-changed", refresh);
  }, [fetchAssumptions]);

  const handleCreate = async () => {
    if (!statement.trim()) return;

    const res = await fetch("/api/assumptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statement, evidence }),
    });

    const assumption = await res.json();
    setAssumptions((prev) => [assumption, ...prev]);
    setStatement("");
    setEvidence("");
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/assumptions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAssumptions((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const updateStatus = async (id: string, validationStatus: string) => {
    const res = await fetch("/api/assumptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, validationStatus }),
    });
    if (res.ok) {
      setAssumptions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, validationStatus: validationStatus as Assumption["validationStatus"] } : a))
      );
    }
  };

  const filtered = selectedArea === "all"
    ? assumptions
    : assumptions.filter((a) => a.area === selectedArea);

  // Count per area
  const areaCounts = (Object.keys(AREA_CONFIG) as AssumptionArea[]).map((area) => ({
    area,
    count: assumptions.filter((a) => a.area === area).length,
  }));

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
          <h1 className="text-lg font-semibold tracking-tight">Assumption Mapper</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Identify and classify assumptions by desirability, feasibility, viability, usability, and risk.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Assumption</Button>
      </div>

      {/* Area filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedArea("all")}
          className={`px-3 py-1.5 rounded-[var(--radius)] text-xs border transition-colors
            ${selectedArea === "all"
              ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
              : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
            }`}
        >
          All ({assumptions.length})
        </button>
        {areaCounts.map(({ area, count }) => {
          const config = AREA_CONFIG[area];
          return (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-1.5 rounded-[var(--radius)] text-xs border transition-colors
                ${selectedArea === area
                  ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                }`}
            >
              {config.emoji} {config.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="❓"
          title="No assumptions yet"
          description="Start mapping your assumptions — beliefs you hold about users, technology, and the market."
          action={<Button onClick={() => setShowCreate(true)}>+ New Assumption</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((assumption) => {
            const areaCfg = AREA_CONFIG[assumption.area];
            const statusCfg = STATUS_CONFIG[assumption.validationStatus];
            const riskCfg = RISK_CONFIG[assumption.risk];

            return (
              <Card key={assumption.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0 mt-0.5">{areaCfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="accent">{areaCfg.label}</Badge>
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      <Badge variant={riskCfg.variant as "default" | "warning" | "danger"}>{riskCfg.label}</Badge>
                    </div>
                    <p className="text-sm text-[var(--text)]">{assumption.statement}</p>
                    {assumption.evidence && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Evidence: {assumption.evidence}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-2">
                      {(["untested", "testing", "validated", "invalidated"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(assumption.id, status)}
                          className={`px-2 py-0.5 rounded text-[10px] border transition-colors
                            ${assumption.validationStatus === status
                              ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                              : "border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]"
                            }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="xs" onClick={() => handleDelete(assumption.id)}>
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
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Assumption">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Statement</label>
            <input
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder='e.g. "Users want a mobile app more than a web dashboard"'
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Evidence (optional)</label>
            <input
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="e.g. 3 out of 5 interviewees mentioned this"
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
            The system will automatically classify this as Desirability, Feasibility, Viability, Usability, or Risk.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!statement.trim()}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}