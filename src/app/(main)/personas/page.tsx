"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Card, Badge, EmptyState, Modal, Spinner } from "@/components/ui";
import type { Persona, Insight } from "@/lib/types";

// List field editor component
function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    if (!input.trim()) return;
    onChange([...items, input.trim()]);
    setInput("");
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
            text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
        />
        <Button size="xs" onClick={add}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <Badge key={i} variant="accent" onClick={() => remove(i)}>
            {item} ×
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  // Create/edit form
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [demographics, setDemographics] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [frustrations, setFrustrations] = useState<string[]>([]);
  const [behaviors, setBehaviors] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<string[]>([]);
  const [jobsToBeDone, setJobsToBeDone] = useState<string[]>([]);

  const fetchPersonas = useCallback(async () => {
    const res = await fetch("/api/personas");
    const data = await res.json();
    setPersonas(data);
    setLoading(false);
  }, []);

  const previousProductRef = useRef("");
  const loaded = useRef(false);
  useEffect(() => {
    const currentProduct = localStorage.getItem("active-product") || "";
    if (currentProduct !== previousProductRef.current) {
      previousProductRef.current = currentProduct;
      setLoading(true);
      fetchPersonas();
    } else if (!loaded.current) {
      loaded.current = true;
      fetchPersonas();
    }
  }, [fetchPersonas]);
  useEffect(() => {
    const refresh = () => { setLoading(true); fetchPersonas(); };
    window.addEventListener("active-product-changed", refresh);
    return () => window.removeEventListener("active-product-changed", refresh);
  }, [fetchPersonas]);

  // "Generate from insights" feature
  const generateFromInsights = async () => {
    const res = await fetch("/api/insights");
    const insights: Insight[] = await res.json();

    if (insights.length === 0) {
      alert("No insights found. Add some insights first.");
      return;
    }

    // Group insights by themes to suggest personas
    const themeGroups = new Map<string, Insight[]>();
    for (const insight of insights) {
      for (const theme of insight.themes) {
        if (!themeGroups.has(theme)) themeGroups.set(theme, []);
        themeGroups.get(theme)!.push(insight);
      }
    }

    // Take the top 3 theme groups as persona seeds
    const topThemes = Array.from(themeGroups.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3);

    const newPersonas: Persona[] = [];

    for (const [theme, themeInsights] of topThemes) {
      const personaName = `${theme.charAt(0).toUpperCase() + theme.slice(1)} User`;

      const persona: Persona = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: personaName,
        role: themeInsights[0]?.source.replace(/_/g, " ") || "User",
        demographics: "Auto-generated from insights",
        goals: [`Improve ${theme} experience`],
        frustrations: themeInsights
          .filter((i) => i.emotion === "negative" || i.emotion === "mixed")
          .map((i) => i.description)
          .slice(0, 5),
        behaviors: [`Interacts with ${theme} features`],
        needs: themeInsights.map((i) => i.tags).flat().slice(0, 5),
        quotes: themeInsights.flatMap((i) => i.quotes).slice(0, 3),
        jobsToBeDone: [
          `Complete tasks related to ${theme}`,
          `Navigate ${theme} successfully`,
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const resp = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(persona),
      });

      newPersonas.push(await resp.json());
    }

    setPersonas((prev) => [...newPersonas, ...prev]);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    const persona: Partial<Persona> = {
      name,
      role,
      demographics,
      goals,
      frustrations,
      behaviors,
      needs,
      quotes,
      jobsToBeDone,
    };

    const res = await fetch("/api/personas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(persona),
    });

    const newPersona = await res.json();
    setPersonas((prev) => [newPersona, ...prev]);
    resetForm();
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/personas/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPersonas((prev) => prev.filter((p) => p.id !== id));
      if (selectedPersona?.id === id) setSelectedPersona(null);
    }
  };

  const resetForm = () => {
    setName("");
    setRole("");
    setDemographics("");
    setGoals([]);
    setFrustrations([]);
    setBehaviors([]);
    setNeeds([]);
    setQuotes([]);
    setJobsToBeDone([]);
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
          <h1 className="text-lg font-semibold tracking-tight">Personas</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Understand your users through goals, frustrations, behaviors, and JTBD.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={generateFromInsights}>
            Generate from Insights
          </Button>
          <Button onClick={() => setShowCreate(true)}>+ New Persona</Button>
        </div>
      </div>

      {personas.length === 0 ? (
        <EmptyState
          icon="👤"
          title="No personas yet"
          description="Create personas manually or generate them automatically from your collected insights."
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={generateFromInsights}>Generate from Insights</Button>
              <Button onClick={() => setShowCreate(true)}>+ New Persona</Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personas.map((persona) => (
            <Card
              key={persona.id}
              className="p-5 cursor-pointer hover:border-[var(--accent)] transition-colors"
              onClick={() => setSelectedPersona(persona)}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-semibold text-sm shrink-0">
                    {persona.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{persona.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)]">{persona.role}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(persona.id); }}
                  className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {persona.frustrations.length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase mb-1">Frustrations</div>
                  <div className="flex flex-wrap gap-1">
                    {persona.frustrations.slice(0, 3).map((f, i) => (
                      <Badge key={i} variant="danger">{f.length > 60 ? f.slice(0, 60) + "..." : f}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {persona.needs.length > 0 && (
                <div>
                  <div className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase mb-1">Needs</div>
                  <div className="flex flex-wrap gap-1">
                    {persona.needs.slice(0, 3).map((n, i) => (
                      <Badge key={i}>{n}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selectedPersona}
        onClose={() => setSelectedPersona(null)}
        title={selectedPersona?.name || ""}
      >
        {selectedPersona && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-semibold text-lg">
                {selectedPersona.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold">{selectedPersona.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {selectedPersona.role} · {selectedPersona.demographics}
                </p>
              </div>
            </div>

            {selectedPersona.goals.length > 0 && (
              <Section title="Goals" items={selectedPersona.goals} variant="success" />
            )}
            {selectedPersona.frustrations.length > 0 && (
              <Section title="Frustrations" items={selectedPersona.frustrations} variant="danger" />
            )}
            {selectedPersona.behaviors.length > 0 && (
              <Section title="Behaviors" items={selectedPersona.behaviors} variant="default" />
            )}
            {selectedPersona.needs.length > 0 && (
              <Section title="Needs" items={selectedPersona.needs} variant="accent" />
            )}
            {selectedPersona.jobsToBeDone.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Jobs To Be Done
                </div>
                <div className="space-y-2">
                  {selectedPersona.jobsToBeDone.map((job, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-[var(--accent)]">→</span>
                      <span>{job}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedPersona.quotes.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Quotes
                </div>
                <div className="space-y-1">
                  {selectedPersona.quotes.map((q, i) => (
                    <p key={i} className="text-sm italic text-[var(--text-secondary)] border-l-2 border-[var(--border)] pl-3">
                      &ldquo;{q}&rdquo;
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} title="Create Persona">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                  text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Role</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Product Designer"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                  text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Demographics</label>
            <input
              value={demographics}
              onChange={(e) => setDemographics(e.target.value)}
              placeholder="e.g. 28-35, urban, tech-savvy"
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <ListEditor label="Goals" items={goals} onChange={setGoals} placeholder="e.g. Save time on reporting" />
          <ListEditor label="Frustrations" items={frustrations} onChange={setFrustrations} placeholder="e.g. Too many clicks" />
          <ListEditor label="Behaviors" items={behaviors} onChange={setBehaviors} placeholder="e.g. Uses mobile primarily" />
          <ListEditor label="Needs" items={needs} onChange={setNeeds} placeholder="e.g. Real-time notifications" />
          <ListEditor label="Quotes" items={quotes} onChange={setQuotes} placeholder='e.g. "This takes forever"' />
          <ListEditor label="Jobs To Be Done" items={jobsToBeDone} onChange={setJobsToBeDone} placeholder="e.g. Schedule social posts" />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setShowCreate(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>Create Persona</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Reusable section for persona detail
function Section({ title, items, variant }: { title: string; items: string[]; variant: "success" | "danger" | "accent" | "default" }) {
  return (
    <div>
      <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{title}</div>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <Badge key={i} variant={variant}>{item}</Badge>
        ))}
      </div>
    </div>
  );
}