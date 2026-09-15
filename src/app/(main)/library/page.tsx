"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Spinner } from "@/components/ui";
import { MonthlyTrend } from "@/components/analytics-charts";
import { monthlyCounts } from "@/lib/analytics";
import { ModuleError } from "@/components/module-feedback";
import { useWorkspace } from "@/components/workspace-context";
import { checkedFetch } from "@/lib/api-client";
import type { Product, ResearchResult } from "@/lib/types";

type Report = Pick<ResearchResult, "id" | "productId" | "query" | "product" | "category" | "createdAt">;

export default function ResearchLibraryPage() {
  const { openWorkspace, createWorkspace } = useWorkspace();
  const [data, setData] = useState<{ products: Product[]; reports: Report[] }>({ products: [], reports: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const load = useCallback(async () => {
    try { setData(await (await checkedFetch("/api/library")).json()); setError(""); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to load your research."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);
  const reports = data.reports.filter(report => `${report.query} ${report.product}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="mx-auto max-w-6xl">
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-[var(--accent)]">Your discovery portfolio</p><h1 className="font-display text-3xl font-semibold">Your research</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Open a research workspace or create another one. Each keeps its own data and Solution Tree.</p></div>
      <Button onClick={createWorkspace} size="md">+ New research</Button>
    </div>
    <ModuleError message={error} retry={() => { setLoading(true); setError(""); void load(); }} />
    {loading ? <div className="grid min-h-48 place-items-center"><Spinner size={24} /></div> : !error && <>
      {data.reports.length === 0 && <section className="discovery-guide mb-8 rounded-2xl border border-[var(--border-strong)] p-7 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Start with a question</p>
        <h2 className="mt-3 font-display text-2xl font-semibold">What would you like to understand better?</h2>
        <p className="my-4 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">You have no saved research reports yet. Explore a customer problem, compare competitors, or investigate a market. Save what you learn and return here to continue.</p>
        <Button size="md" onClick={() => data.products[0] ? openWorkspace(data.products[0], "/research?new=1") : createWorkspace()}>Start your first research</Button>
      </section>}
      {data.reports.length > 0 && <div className="mb-8"><MonthlyTrend title="Research over time" description="Reports saved each month across your workspaces, including the current month." items={monthlyCounts(data.reports.map(report => report.createdAt))} /></div>}
      {data.reports.length > 0 && <section aria-labelledby="reports-heading" className="mb-9">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 id="reports-heading" className="text-lg font-semibold">Saved reports <span className="text-[var(--text-secondary)]">({data.reports.length})</span></h2><input aria-label="Search your research" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search reports or products" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm sm:w-72" /></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{reports.map(report => {
          const product = data.products.find(item => item.id === report.productId);
          return <button key={report.id} onClick={() => product && openWorkspace(product, `/research/${encodeURIComponent(report.id)}`)} className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 text-left transition-colors hover:border-[var(--accent)]">
            <span className="text-xs capitalize text-[var(--accent)]">{report.category.replaceAll("_", " ")}</span><h3 className="my-3 text-base font-semibold leading-6">{report.query}</h3><p className="mt-auto text-xs text-[var(--text-secondary)]">{product?.name || report.product}</p><div className="mt-4 flex w-full justify-between text-xs text-[var(--text-secondary)]"><span>{new Date(report.createdAt).toLocaleDateString()}</span><span className="text-[var(--accent)]">Read report &rarr;</span></div>
          </button>;
        })}</div>
        {reports.length === 0 && <p className="py-8 text-sm text-[var(--text-secondary)]">No reports match that search. Try a different keyword.</p>}
      </section>}
      {data.products.length > 0 && <section aria-labelledby="workspaces-heading"><h2 id="workspaces-heading" className="mb-2 text-lg font-semibold">Research workspaces</h2><p className="mb-4 text-sm text-[var(--text-secondary)]">Open one to work with only its evidence, priorities, experiments, and Solution Tree.</p><div className="grid gap-4 md:grid-cols-2">{data.products.map(product => <article key={product.id} className="rounded-xl border border-[var(--border)] p-5"><h3 className="break-words font-semibold">{product.name}</h3><p className="my-2 text-xs text-[var(--text-secondary)]">{product.researchCount || 0} saved reports</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => openWorkspace(product)}>Open research</Button><Button variant="ghost" onClick={() => openWorkspace(product, "/research?new=1")}>+ New report in this research</Button></div></article>)}</div></section>}
    </>}
  </div>;
}
