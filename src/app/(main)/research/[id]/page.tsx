"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, Badge, Spinner, Textarea } from "@/components/ui";
import type { ResearchResult } from "@/lib/types";
import { ArrowUpRight, BarChart3, BrainCircuit, FileDown, Lightbulb, Search, Sparkles, Target } from "@/components/icons";

const TYPE_STYLE: Record<string, "accent" | "success" | "warning" | "danger" | "default"> = {
  opportunity: "success", market_gap: "accent", risk: "danger", trend: "warning", competitor_move: "warning", key_finding: "default",
};

export default function ResearchWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const [research, setResearch] = useState<ResearchResult | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetch(`/api/research/${id}`).then(async response => { if (!response.ok) throw new Error("Not found"); const data = await response.json() as ResearchResult; setResearch(data); setNotes(data.notes ?? ""); }).catch(() => setResearch(null)).finally(() => setLoading(false)); }, [id]);
  const saveNotes = async () => { if (!research) return; setSaving(true); setSaved(false); try { const response = await fetch(`/api/research/${research.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) }); if (!response.ok) throw new Error("Save failed"); const updated = await response.json() as ResearchResult; setResearch(updated); setNotes(updated.notes ?? ""); setSaved(true); } finally { setSaving(false); } };
  if (loading) return <div className="flex justify-center py-24"><Spinner size={25}/></div>;
  if (!research) return <div className="mx-auto max-w-xl py-20 text-center"><Search size={30} className="mx-auto mb-4 text-[var(--accent)]"/><h1 className="font-display text-xl font-semibold">Research not found</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">This research record may have been deleted.</p><Link className="mt-5 inline-block text-sm text-[var(--accent)]" href="/research">Back to research</Link></div>;
  const category = research.category.replace(/_/g, " ");
  return <div className="mx-auto max-w-5xl animate-fadein">
    <Link href="/research" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text)]">← All research</Link>
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[.15em] text-[var(--accent)]"><BrainCircuit size={15}/>Research workspace</div><h1 className="font-display text-3xl font-semibold tracking-tight">{research.product || "Untitled research"}</h1><p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">{research.query}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="accent">{category}</Badge><Badge variant="default">{new Date(research.createdAt).toLocaleDateString()}</Badge><Badge variant="default">{research.sources.length} sources</Badge></div></div>{research.savedFile && <a href={`/api/research/${research.id}/download`} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"><FileDown size={15}/>Download report</a>}</div>
    <div className="grid gap-6 lg:grid-cols-3"><div className="space-y-6 lg:col-span-2"><Card className="p-5"><h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold"><Sparkles size={17} className="text-[var(--accent)]"/>Research summary</h2><p className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">{research.summary}</p></Card>
      <section><div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 font-display text-base font-semibold"><Lightbulb size={17} className="text-[var(--data)]"/>Individual findings</h2><span className="font-mono text-xs text-[var(--text-tertiary)]">{research.insights.length} findings</span></div><div className="grid gap-3 sm:grid-cols-2">{research.insights.map((finding, index) => <Card key={`${finding.title}-${index}`} className="border-l-2 border-l-[var(--accent)] p-4"><div className="mb-2 flex items-start justify-between gap-2"><Badge variant={TYPE_STYLE[finding.type] ?? "default"}>{finding.type.replace(/_/g, " ")}</Badge><span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">{finding.confidence}</span></div><h3 className="text-sm font-semibold">{finding.title}</h3><p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{finding.description}</p>{finding.nextSteps?.length ? <div className="mt-3 border-t border-[var(--border)] pt-3"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Next steps</p>{finding.nextSteps.map(step => <p key={step} className="flex gap-1 text-xs text-[var(--text-secondary)]"><ArrowUpRight size={12} className="mt-0.5 shrink-0 text-[var(--accent)]"/>{step}</p>)}</div> : null}</Card>)}</div></section>
      {research.recommendations.length > 0 && <Card className="p-5"><h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold"><Target size={17} className="text-[var(--accent)]"/>Recommendations</h2><ol className="space-y-3">{research.recommendations.map((recommendation, index) => <li className="flex gap-3 text-sm text-[var(--text-secondary)]" key={recommendation}><span className="font-mono text-[var(--accent)]">0{index + 1}</span>{recommendation}</li>)}</ol></Card>}</div>
      <aside className="space-y-6"><Card className="border-[var(--accent)] bg-[var(--accent-light)] p-4"><div className="mb-2 flex items-center gap-2"><Sparkles size={16} className="text-[var(--accent)]"/><h2 className="font-display text-sm font-semibold">Working notes</h2></div><p className="mb-3 text-xs leading-5 text-[var(--text-secondary)]">Add decisions, context, or follow-up evidence for this research only.</p><Textarea value={notes} onChange={setNotes} placeholder="Capture your interpretation, links, decisions, and next actions…" minRows={9}/><div className="mt-3 flex items-center justify-between gap-2"><span className="text-[11px] text-[var(--text-tertiary)]">{saved ? "Saved" : ""}</span><Button onClick={saveNotes} disabled={saving}>{saving ? <Spinner size={14}/> : "Save notes"}</Button></div></Card>
      {research.marketSize && <Card className="p-4"><h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><BarChart3 size={16} className="text-[var(--data)]"/>Market size</h2><p className="text-sm text-[var(--text-secondary)]">{research.marketSize}</p></Card>}
      {research.sources.length > 0 && <Card className="p-4"><h2 className="mb-3 text-sm font-semibold">Sources</h2><div className="space-y-3">{research.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block border-b border-[var(--border)] pb-3 last:border-0 last:pb-0"><p className="flex items-start gap-1 text-xs font-medium text-[var(--accent)] hover:underline">{source.title}<ArrowUpRight size={12} className="mt-0.5 shrink-0"/></p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[var(--text-secondary)]">{source.snippet}</p></a>)}</div></Card>}</aside>
    </div>
  </div>;
}
