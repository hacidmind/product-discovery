"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Modal, Spinner, ConfirmDialog } from "@/components/ui";
import { ModuleError } from "@/components/module-feedback";
import { checkedFetch } from "@/lib/api-client";
import type { ResearchResult, ResearchQuery } from "@/lib/types";

const categories: { value: ResearchQuery["category"]; label: string; description: string }[] = [
  { value: "product", label: "Product analysis", description: "Understand a product, its strengths, and the needs it serves." },
  { value: "solution", label: "Solution landscape", description: "Compare approaches and vendors for a customer problem." },
  { value: "market_insight", label: "Market insights", description: "Explore market signals, segments, and growth." },
  { value: "gap_analysis", label: "Gap analysis", description: "Look for unmet needs and underserved customers." },
  { value: "competitor", label: "Competitor analysis", description: "Understand alternatives and areas of differentiation." },
  { value: "trend", label: "Trend research", description: "Explore emerging patterns and their product implications." },
];
function ResearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(searchParams.has("new"));
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState<ResearchQuery["category"]>("product");
  const [filter, setFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setResults(await (await checkedFetch("/api/research")).json()); setError(""); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not load your reports."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);
  const create = async () => {
    if (saving || !query.trim() || !product.trim()) return;
    setSaving(true); setError("");
    try {
      const result = await (await checkedFetch("/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: query.trim(), product: product.trim(), category }) })).json() as ResearchResult;
      setShowForm(false); router.push(`/research/${encodeURIComponent(result.id)}`);
    } catch (error) { setError(error instanceof Error ? error.message : "Research could not be completed. Please try again."); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!deleteId || saving) return;
    setSaving(true); setError("");
    try { await checkedFetch(`/api/research/${encodeURIComponent(deleteId)}`, { method: "DELETE" }); setResults(previous => previous.filter(item => item.id !== deleteId)); setDeleteId(null); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not delete the report."); }
    finally { setSaving(false); }
  };
  const visible = results.filter(result => `${result.query} ${result.product}`.toLowerCase().includes(filter.toLowerCase()));
  return <div className="mx-auto max-w-5xl">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-display text-2xl font-semibold">Research reports</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Ask a focused question. Review the evidence. Capture what it means for your product.</p></div><Button size="md" onClick={() => { setError(""); setShowForm(true); }}>+ New research</Button></div>
    <ModuleError message={error} retry={() => { setLoading(true); setError(""); void load(); }} />
    {loading ? <div className="grid min-h-48 place-items-center"><Spinner size={24} /></div> : results.length === 0 ? <section className="discovery-guide rounded-2xl border border-[var(--border)] p-8"><p className="text-xs uppercase tracking-wider text-[var(--accent)]">A question is a good beginning</p><h2 className="my-3 text-xl font-semibold">Start your first research report</h2><p className="mb-5 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">Explore a product, compare competitors, or understand a market. For example: What prevents small businesses from completing their first payment?</p><Button onClick={() => setShowForm(true)}>Create research</Button><Link href="/import" className="ml-4 text-sm text-[var(--accent)] underline">Import existing evidence</Link></section> : <>
      <input aria-label="Search reports in this workspace" value={filter} onChange={event => setFilter(event.target.value)} placeholder="Find a report by question or product" className="mb-5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3 text-sm" />
      <div className="grid gap-4 md:grid-cols-2">{visible.map(result => <article key={result.id} className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5"><span className="text-xs text-[var(--accent)]">{categories.find(item => item.value === result.category)?.label || "Research"}</span><h2 className="my-3 text-base font-semibold"><Link href={`/research/${encodeURIComponent(result.id)}`} className="hover:underline">{result.query}</Link></h2><p className="mb-3 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">{result.summary}</p><p className="mt-auto text-xs text-[var(--text-secondary)]">{result.product} &middot; {new Date(result.createdAt).toLocaleDateString()}</p><div className="mt-4 flex items-center justify-between"><Link href={`/research/${encodeURIComponent(result.id)}`} className="text-sm font-medium text-[var(--accent)]">Read report &rarr;</Link><Button variant="ghost" onClick={() => { setError(""); setDeleteId(result.id); }}>Delete report</Button></div></article>)}</div>
      {visible.length === 0 && <p className="py-8 text-sm text-[var(--text-secondary)]">No reports match your search.</p>}
    </>}
    <Modal open={showForm} onClose={() => { if (!saving) setShowForm(false); }} title="Start new research"><form onSubmit={event => { event.preventDefault(); void create(); }} className="space-y-4"><ModuleError message={error} /><label className="block text-sm font-medium">Research question<textarea required maxLength={2000} rows={4} value={query} onChange={event => setQuery(event.target.value)} placeholder="What do you need to learn to make your next decision?" className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm" /></label><label className="block text-sm font-medium">Product or market<input required maxLength={200} value={product} onChange={event => setProduct(event.target.value)} placeholder="e.g. Small business payments" className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm" /></label><label className="block text-sm font-medium">Research type<select value={category} onChange={event => setCategory(event.target.value as ResearchQuery["category"])} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm">{categories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><p className="text-xs leading-5 text-[var(--text-secondary)]">{categories.find(item => item.value === category)?.description} Findings are a starting point: check sources before using them in a decision.</p><Button type="submit" disabled={saving || !query.trim() || !product.trim()}>{saving ? "Researching..." : "Start research"}</Button>{saving && <p role="status" className="text-xs text-[var(--text-secondary)]">Gathering sources and preparing your report. This can take a moment.</p>}</form></Modal>
    <ConfirmDialog open={!!deleteId} onClose={() => { if (!saving) setDeleteId(null); }} title="Delete this report?" message={error || "This permanently removes the report and its working notes."} onConfirm={remove} />
  </div>;
}

export default function ResearchPage() { return <Suspense fallback={<Spinner size={24} />}><ResearchPageContent /></Suspense>; }
