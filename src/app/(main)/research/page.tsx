"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"
const dummy = undefined; // ensure import hook available
import {
  Textarea,
  Button,
  Card,
  Badge,
  EmptyState,
  Spinner,
  Select,
} from "@/components/ui";
import type { ResearchResult, ResearchQuery } from "@/lib/types";

const CATEGORIES: { value: ResearchQuery["category"]; label: string; icon: string; desc: string }[] = [
  { value: "product", label: "Product Analysis", icon: "\uD83D\uDCE6", desc: "Deep-dive on a specific product or tool" },
  { value: "solution", label: "Solution Landscape", icon: "\uD83D\uDDFA\uFE0F", desc: "Explore a solution space & vendor landscape" },
  { value: "market_insight", label: "Market Insights", icon: "\uD83D\uDCCA", desc: "Market size, growth, and trends" },
  { value: "gap_analysis", label: "Gap Analysis", icon: "\uD83D\uDD0D", desc: "Identify unmet needs & whitespace opportunities" },
  { value: "competitor", label: "Competitor Intel", icon: "\u2694\uFE0F", desc: "Competitive landscape analysis" },
  { value: "trend", label: "Trend Research", icon: "\uD83D\uDCC8", desc: "Emerging technology & market trends" },
];

const INSIGHT_CONFIG: Record<string, { icon: string; color: string }> = {
  key_finding: { icon: "\uD83D\uDD0E", color: "border-l-blue-400" },
  market_gap: { icon: "\uD83D\uDC8E", color: "border-l-purple-400" },
  opportunity: { icon: "\uD83D\uDE80", color: "border-l-green-400" },
  risk: { icon: "\u26A0\uFE0F", color: "border-l-red-400" },
  trend: { icon: "\uD83D\uDCC8", color: "border-l-orange-400" },
  competitor_move: { icon: "\u2694\uFE0F", color: "border-l-yellow-400" },
};

const CONFIDENCE_BADGE: Record<string, { label: string; variant: "success" | "warning" | "default" }> = {
  high: { label: "High confidence", variant: "success" },
  medium: { label: "Medium confidence", variant: "warning" },
  low: { label: "Low confidence", variant: "default" },
};

export default function ResearchPage() {
  const router = useRouter();
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ResearchResult | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
  const [expandedCompetitor, setExpandedCompetitor] = useState<number | null>(null);
  const [showMarketDetail, setShowMarketDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showFindingsBreakdown, setShowFindingsBreakdown] = useState(false);

  const [query, setQuery] = useState("");
  const [product, setProduct] = useState("");
  const [category, setCategory] = useState<ResearchQuery["category"]>("product");

  const fetchResults = async () => {
    const res = await fetch("/api/research");
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };

  const loaded = useRef(false);
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      fetchResults();
    }
  }, []);
  useEffect(() => {
    const refresh = () => { setLoading(true); fetchResults(); };
    window.addEventListener("active-product-changed", refresh);
    return () => window.removeEventListener("active-product-changed", refresh);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);

    const res = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, product, category }),
    });

    const result = await res.json();
    setResults((prev) => [result, ...prev]);
    setSelectedResult(result);
    setSearching(false);
    setShowForm(false);
    setQuery("");
    setProduct("");
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/research/${id}`, { method: "DELETE" });
    if (res.ok) {
      setResults((prev) => prev.filter((r) => r.id !== id));
      if (selectedResult?.id === id) setSelectedResult(null);
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
    <div className="max-w-5xl mx-auto animate-fadein">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Product Research</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Research products, solutions, market trends, and competitive landscapes.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ New Research</Button>
      </div>

      {showForm && (
        <Card className="mb-6 p-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                What do you want to research?
              </label>
              <Textarea
                value={query}
                onChange={setQuery}
                placeholder="e.g. AI code assistants for enterprise teams, mobile payment solutions in Africa, etc."
                minRows={3}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                  Product / Solution Name
                </label>
                <input
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. GitHub Copilot, Flutterwave"
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                    text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                  Research Type
                </label>
                <Select
                  value={category}
                  onChange={(v) => setCategory(v as ResearchQuery["category"])}
                  options={CATEGORIES.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }))}
                />
              </div>
            </div>

            <p className="text-xs text-[var(--text-tertiary)]">
              {CATEGORIES.find((c) => c.value === category)?.desc}
            </p>

            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--text-tertiary)]">
                Sources: DuckDuckGo, Wikipedia + simulation fallback
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSearch} disabled={!query.trim() || searching}>
                  {searching ? <Spinner size={14} /> : "Research"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {results.length === 0 ? (
        <EmptyState
          icon="\uD83D\uDD2C"
          title="No research yet"
          description="Search for products, analyze markets, identify gaps, and get detailed competitive intelligence."
          action={<Button onClick={() => setShowForm(true)}>+ New Research</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Research History
            </h2>
            {results.map((r) => {
              const cat = CATEGORIES.find((c) => c.value === r.category);
              return (
                <Card
                  key={r.id}
                  className={`p-3 cursor-pointer transition-colors ${selectedResult?.id === r.id
                    ? "border-[var(--accent)] bg-[var(--accent-light)]"
                    : "hover:border-[var(--accent)]"
                    }`}
                  onClick={() => router.push(`/research/${r.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs">{cat?.icon}</span>
                        <span className="text-xs font-medium truncate">{r.product}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">
                        {r.query}
                      </p>
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                      className="p-0.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] shrink-0"
                    >
                      <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="lg:col-span-2">
            {selectedResult ? (
              <div className="space-y-4 animate-fadein">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {CATEGORIES.find((c) => c.value === selectedResult.category)?.icon && (
                      <span>{CATEGORIES.find((c) => c.value === selectedResult.category)!.icon}</span>
                    )}
                    <h2 className="text-sm font-semibold">{selectedResult.product}</h2>
                    <Badge variant="accent">
                      {CATEGORIES.find((c) => c.value === selectedResult.category)?.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-3">{selectedResult.query}</p>
                  <p className="text-sm text-[var(--text)] leading-relaxed">{selectedResult.summary}</p>
                  {"savedFile" in selectedResult && selectedResult.savedFile && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)]">
                      <a
                        href={`/api/research/${selectedResult.id}/download`}
                        className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                          <polyline points="9 15 12 18 15 15" />
                        </svg>
                        {selectedResult.savedFile}
                      </a>
                      <span className="text-[10px] text-[var(--text-tertiary)] ml-6">
                        Stored in solutions/ folder
                      </span>
                    </div>
                  )}
                </Card>

                {/* ─── Findings Breakdown Toggle Button ─── */}
                {selectedResult.insights.length > 0 && !showFindingsBreakdown && (
                  <button
                    onClick={() => setShowFindingsBreakdown(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius)] border-2 border-dashed border-[var(--accent)] bg-[var(--accent-light)] hover:bg-[var(--accent)] hover:text-white text-[var(--accent)] transition-all group cursor-pointer animate-fadein"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:stroke-white">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span className="text-sm font-semibold">View Findings Breakdown &amp; Take Action</span>
                    <span className="text-xs opacity-70 group-hover:opacity-100">
                      ({selectedResult.insights.length} insights, {selectedResult.insights.filter(i => i.type === "opportunity" || i.type === "market_gap").length} opportunities)
                    </span>
                  </button>
                )}

                {/* ─── Findings Breakdown CTA ─── */}
                {selectedResult.insights.length > 0 && showFindingsBreakdown && (
                  <Card className="p-4 border-[var(--accent)] bg-[var(--accent-light)] animate-fadein">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📊</span>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Findings Breakdown</h3>
                      </div>
                      <button
                        onClick={() => setShowFindingsBreakdown(false)}
                        className="p-1 rounded hover:bg-[var(--bg)] text-[var(--text-secondary)] transition-colors"
                        aria-label="Close findings breakdown"
                      >
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>

                    {(() => {
                      const findingInsights = selectedResult.insights;
                      const byType = {
                        opportunity: findingInsights.filter((i) => i.type === "opportunity"),
                        risk: findingInsights.filter((i) => i.type === "risk"),
                        market_gap: findingInsights.filter((i) => i.type === "market_gap"),
                        trend: findingInsights.filter((i) => i.type === "trend"),
                        competitor_move: findingInsights.filter((i) => i.type === "competitor_move"),
                        key_finding: findingInsights.filter((i) => i.type === "key_finding"),
                      };
                      const highConfidence = findingInsights.filter((i) => i.confidence === "high");
                      const marketGaps = byType.market_gap.concat(byType.opportunity);
                      const risksAndThreats = byType.risk.concat(byType.competitor_move);
                      const trends = byType.trend;

                      return (
                        <div className="space-y-3">
                          {/* Summary Strip */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="bg-[var(--bg)] rounded-[var(--radius)] p-2 text-center">
                              <p className="text-lg font-bold font-mono text-[var(--text)]">{findingInsights.length}</p>
                              <p className="text-[10px] text-[var(--text-secondary)]">Total Insights</p>
                            </div>
                            <div className="bg-[var(--bg)] rounded-[var(--radius)] p-2 text-center">
                              <p className="text-lg font-bold font-mono text-green-500">{marketGaps.length}</p>
                              <p className="text-[10px] text-[var(--text-secondary)]">Opportunities &amp; Gaps</p>
                            </div>
                            <div className="bg-[var(--bg)] rounded-[var(--radius)] p-2 text-center">
                              <p className="text-lg font-bold font-mono text-red-400">{risksAndThreats.length}</p>
                              <p className="text-[10px] text-[var(--text-secondary)]">Risks &amp; Threats</p>
                            </div>
                            <div className="bg-[var(--bg)] rounded-[var(--radius)] p-2 text-center">
                              <p className="text-lg font-bold font-mono text-[var(--text)]">{highConfidence.length}</p>
                              <p className="text-[10px] text-[var(--text-secondary)]">High Confidence</p>
                            </div>
                          </div>

                          {/* Top Opportunities */}
                          {marketGaps.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-green-500 uppercase tracking-wider mb-1">
                                Top Opportunities &amp; Market Gaps
                              </p>
                              <div className="space-y-1">
                                {marketGaps.slice(0, 3).map((insight, idx) => (
                                  <div key={idx} className="text-xs text-[var(--text)] flex items-start gap-1.5 pl-1">
                                    <span className="text-green-400 mt-0.5 shrink-0">•</span>
                                    <span>
                                      <strong>{insight.title}</strong>
                                      {insight.description && ` — ${insight.description.length > 100 ? insight.description.slice(0, 100) + "..." : insight.description}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Top Risks */}
                          {risksAndThreats.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">
                                Key Risks &amp; Competitive Threats
                              </p>
                              <div className="space-y-1">
                                {risksAndThreats.slice(0, 3).map((insight, idx) => (
                                  <div key={idx} className="text-xs text-[var(--text)] flex items-start gap-1.5 pl-1">
                                    <span className="text-red-400 mt-0.5 shrink-0">•</span>
                                    <span>
                                      <strong>{insight.title}</strong>
                                      {insight.description && ` — ${insight.description.length > 100 ? insight.description.slice(0, 100) + "..." : insight.description}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Emerging Trends */}
                          {trends.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider mb-1">
                                Emerging Trends
                              </p>
                              <div className="space-y-1">
                                {trends.slice(0, 2).map((insight, idx) => (
                                  <div key={idx} className="text-xs text-[var(--text)] flex items-start gap-1.5 pl-1">
                                    <span className="text-orange-400 mt-0.5 shrink-0">•</span>
                                    <span>
                                      <strong>{insight.title}</strong>
                                      {insight.description && ` — ${insight.description.length > 100 ? insight.description.slice(0, 100) + "..." : insight.description}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Market & Competitive Quick Summary */}
                          <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg)] rounded-[var(--radius)] p-2 leading-relaxed">
                            <span className="font-semibold text-[var(--text)]">Market:</span>{" "}
                            {selectedResult.marketSize}
                            {selectedResult.competitors.length > 0 && (
                              <>
                                {" "}• <span className="font-semibold text-[var(--text)]">Key Players:</span>{" "}
                                {selectedResult.competitors.slice(0, 4).join(", ")}
                              </>
                            )}
                            {selectedResult.recommendations.length > 0 && (
                              <>
                                {" "}• <span className="font-semibold text-[var(--text)]">Top Recommendation:</span>{" "}
                                {selectedResult.recommendations[0].length > 120
                                  ? selectedResult.recommendations[0].slice(0, 120) + "..."
                                  : selectedResult.recommendations[0]}
                              </>
                            )}
                          </div>

                          {/* Action CTAs */}
                          <div className="border-t border-[var(--accent)] pt-3">
                            <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                              Take Action on These Findings
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={`/opportunities?from=research&title=${encodeURIComponent(marketGaps[0]?.title || selectedResult.product + " opportunity")}&context=${encodeURIComponent(`Based on research: ${selectedResult.product} — ${selectedResult.summary.slice(0, 200)}`)}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Create Opportunity
                              </a>
                              <a
                                href={`/features?from=research&title=${encodeURIComponent("Feature for " + selectedResult.product)}&context=${encodeURIComponent(selectedResult.summary.slice(0, 200))}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Create Feature
                              </a>
                              {risksAndThreats.length > 0 && (
                                <a
                                  href={`/assumptions?from=research&statement=${encodeURIComponent(risksAndThreats[0]?.title || "Assumption from " + selectedResult.product)}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                  Create Assumption
                                </a>
                              )}
                              <a
                                href={`/experiments?from=research&title=${encodeURIComponent("Validate: " + selectedResult.product)}&context=${encodeURIComponent(selectedResult.summary.slice(0, 200))}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius)] text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Create Experiment
                              </a>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => setShowForm(true)}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                Deeper Research
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </Card>
                )}

                {selectedResult.insights.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                      Key Insights
                    </h3>
                    <div className="space-y-2">
                      {selectedResult.insights.map((insight, i) => {
                        const cfg = INSIGHT_CONFIG[insight.type];
                        const badge = CONFIDENCE_BADGE[insight.confidence];
                        const isExpanded = expandedInsight === i;
                        return (
                          <div key={i}>
                            <div
                              className={`border-l-2 ${cfg.color} pl-3 py-2 bg-[var(--bg-secondary)] rounded-r-[var(--radius)] cursor-pointer hover:border-l-4 transition-all`}
                              onClick={() => setExpandedInsight(isExpanded ? null : i)}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span>{cfg.icon}</span>
                                <span className="text-xs font-medium">{insight.title}</span>
                                <Badge variant={badge.variant as "success" | "warning" | "default"}>
                                  {badge.label}
                                </Badge>
                                <span className="text-[10px] text-[var(--text-tertiary)] ml-auto">
                                  {isExpanded ? "collapse" : "click for details"}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--text-secondary)]">{insight.description}</p>
                            </div>
                            {isExpanded && (
                              <div className="mt-2 ml-3 pl-4 border-l border-[var(--border)] animate-fadein">
                                {insight.detail && (
                                  <div className="mb-3">
                                    <p className="text-xs text-[var(--text)] leading-relaxed">{insight.detail}</p>
                                  </div>
                                )}
                                {insight.supportingEvidence && insight.supportingEvidence.length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Supporting Evidence</p>
                                    <ul className="space-y-0.5">
                                      {insight.supportingEvidence.map((ev, j) => (
                                        <li key={j} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                                          <span className="text-[var(--accent)] mt-0.5">\u2022</span>
                                          {ev}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {insight.nextSteps && insight.nextSteps.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Recommended Next Steps</p>
                                    <ul className="space-y-0.5">
                                      {insight.nextSteps.map((step, j) => (
                                        <li key={j} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                                          <span className="text-[var(--success)] mt-0.5 font-bold text-[10px]">{j + 1}.</span>
                                          {step}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedResult.competitors.length > 0 && (
                    <Card
                      className="p-4 cursor-pointer hover:border-[var(--accent)] transition-colors"
                      onClick={() => setExpandedCompetitor(expandedCompetitor === null ? 0 : null)}
                    >
                      <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center justify-between">
                        Competitors
                        <span className="text-[10px] text-[var(--text-tertiary)]">
                          {expandedCompetitor !== null ? "collapse" : "click for details"}
                        </span>
                      </h3>
                      <div className="space-y-1">
                        {selectedResult.competitors.map((c, i) => (
                          <div key={i}>
                            <div
                              className={`flex items-center gap-2 text-sm py-0.5 ${expandedCompetitor !== null ? "cursor-pointer hover:text-[var(--accent)]" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (expandedCompetitor !== null) setExpandedCompetitor(expandedCompetitor === i ? null : i);
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                              <span>{c}</span>
                            </div>
                            {expandedCompetitor === i && selectedResult.competitorDetails?.[i] && (
                              <div className="ml-4 mt-1 mb-2 p-3 bg-[var(--bg-secondary)] rounded-[var(--radius)] text-xs space-y-1.5 animate-fadein">
                                <p className="text-[var(--text)]">{selectedResult.competitorDetails[i].description}</p>
                                {selectedResult.competitorDetails[i].funding && (
                                  <p><span className="font-medium">Funding:</span> {selectedResult.competitorDetails[i].funding}</p>
                                )}
                                {selectedResult.competitorDetails[i].marketShare && (
                                  <p><span className="font-medium">Market Share:</span> {selectedResult.competitorDetails[i].marketShare}</p>
                                )}
                                {selectedResult.competitorDetails[i].strengths && (
                                  <div>
                                    <span className="font-medium text-[var(--success)]">Strengths:</span>
                                    <ul className="list-disc list-inside mt-0.5 text-[var(--text-secondary)]">
                                      {selectedResult.competitorDetails[i].strengths.map((s, si) => (
                                        <li key={si}>{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {selectedResult.competitorDetails[i].weaknesses && (
                                  <div>
                                    <span className="font-medium text-[var(--danger)]">Weaknesses:</span>
                                    <ul className="list-disc list-inside mt-0.5 text-[var(--text-secondary)]">
                                      {selectedResult.competitorDetails[i].weaknesses.map((w, wi) => (
                                        <li key={wi}>{w}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  <Card
                    className={`p-4 ${!selectedResult.competitors.length ? "sm:col-span-2" : ""} cursor-pointer hover:border-[var(--accent)] transition-colors`}
                    onClick={() => setShowMarketDetail(!showMarketDetail)}
                  >
                    <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center justify-between">
                      Market Size
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        {showMarketDetail ? "collapse" : "click for breakdown"}
                      </span>
                    </h3>
                    <p className="text-lg font-bold font-mono">{selectedResult.marketSize}</p>
                    {showMarketDetail && selectedResult.marketSizeDetail && (
                      <div className="mt-3 space-y-3 animate-fadein">
                        <div>
                          <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Growth</p>
                          <p className="text-sm text-[var(--text)]">{selectedResult.marketSizeDetail.growth}</p>
                        </div>
                        {selectedResult.marketSizeDetail.segments && (
                          <div>
                            <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Market Segments</p>
                            <div className="space-y-1">
                              {selectedResult.marketSizeDetail.segments.map((seg, si) => (
                                <div key={si} className="flex items-center gap-2">
                                  <span className="text-xs text-[var(--text)] w-20">{seg.name}</span>
                                  <div className="flex-1 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                    <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: seg.share }} />
                                  </div>
                                  <span className="text-xs font-mono text-[var(--text-secondary)] w-14 text-right">{seg.value}</span>
                                  <span className="text-[10px] text-[var(--text-tertiary)] w-8 text-right">{seg.share}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedResult.marketSizeDetail.regions && (
                          <div>
                            <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Regional Distribution</p>
                            <div className="space-y-1">
                              {selectedResult.marketSizeDetail.regions.map((r, ri) => (
                                <div key={ri} className="flex items-center gap-2">
                                  <span className="text-xs text-[var(--text)] w-24">{r.name}</span>
                                  <div className="flex-1 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                    <div className="h-full bg-[var(--success)] rounded-full" style={{ width: r.share }} />
                                  </div>
                                  <span className="text-xs font-mono text-[var(--text-secondary)] w-10 text-right">{r.share}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedResult.marketSizeDetail.drivers && (
                          <div>
                            <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Growth Drivers</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedResult.marketSizeDetail.drivers.map((d, di) => (
                                <Badge key={di} variant="success">{d}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedResult.marketSizeDetail.barriers && (
                          <div>
                            <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Barriers</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedResult.marketSizeDetail.barriers.map((b, bi) => (
                                <Badge key={bi} variant="warning">{b}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>

                {selectedResult.recommendations.length > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Recommendations
                      </h3>
                      <button
                        onClick={() => {
                          const content = `# Recommendations for ${selectedResult.product}\n\n` +
                            selectedResult.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n") +
                            `\n\n---\n*Generated by Product Discovery Agent*`;
                          const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `recommendations-${selectedResult.product.replace(/\s+/g, "-").toLowerCase()}.md`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline transition-colors"
                        title="Download detailed recommendations"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedResult.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-xs font-bold text-[var(--accent)] mt-0.5">{i + 1}</span>
                          <p className="text-sm text-[var(--text)]">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {selectedResult.sources.length > 0 && (
                  <Card className="p-4">
                    <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                      Sources
                    </h3>
                    <div className="space-y-2">
                      {selectedResult.sources.map((src, i) => (
                        <div key={i} className="border-b border-[var(--border)] last:border-b-0 pb-2 last:pb-0">
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-[var(--accent)] hover:underline"
                          >
                            {src.title}
                          </a>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{src.snippet}</p>
                          <span className="text-[10px] text-[var(--text-tertiary)]">
                            Relevance: {Math.round(src.relevance * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-20 text-[var(--text-tertiary)] text-sm">
                Select a research result to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
