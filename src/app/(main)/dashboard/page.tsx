"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Card, Badge, PriorityBadge, Spinner, Button } from "@/components/ui";
import { AlertTriangle, ArrowUpRight, BrainCircuit, Download, FileDown, FlaskConical, Lightbulb, MessageSquare, ShieldQuestion, Sparkles, Target, Users } from "@/components/icons";
import type {
  Insight, Opportunity, Feature,
} from "@/lib/types";

function StatCard({ label, value, Icon, href, tone = "accent" }: { label: string; value: number; Icon: React.ComponentType<{ size?: number }>; href: string; tone?: "accent" | "data" }) {
  return (
    <Link href={href}>
      <Card className="group h-full p-4 hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]">
        <div className={`mb-5 grid size-9 place-items-center rounded-lg ${tone === "data" ? "bg-[#123330] text-[var(--data)]" : "bg-[var(--accent-light)] text-[var(--accent)]"}`}><Icon size={18} /></div>
        <div className="font-mono text-2xl font-semibold tracking-tight">{value}</div>
        <div className="mt-1 flex items-center justify-between text-xs text-[var(--text-secondary)]">{label}<ArrowUpRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" /></div>
      </Card>
    </Link>
  );
}

function relativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${Math.floor(diffMonth / 12)}y ago`;
}

const ENTITY_ICONS: Record<string, string> = {
  insight: "💡",
  persona: "👤",
  interview: "💬",
  feature: "⚡",
  experiment: "🔬",
  assumption: "❓",
  research: "🔍",
  opportunity: "◆",
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalInsights: 0,
    totalOpportunities: 0,
    totalPersonas: 0,
    totalInterviews: 0,
    totalFeatures: 0,
    totalExperiments: 0,
    totalAssumptions: 0,
  });
  const [topOpportunities, setTopOpportunities] = useState<Opportunity[]>([]);
  const [commonProblems, setCommonProblems] = useState<{ theme: string; count: number }[]>([]);
  const [topFeatures, setTopFeatures] = useState<Feature[]>([]);
  const [recentInsights, setRecentInsights] = useState<Insight[]>([]);
  const [researchResults, setResearchResults] = useState<{ id: string; product: string; recommendations: string[] }[]>([]);
  const [activityFeed, setActivityFeed] = useState<{ type: string; title: string; createdAt: string }[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard data");
      const data = await res.json();
      setStats(data.stats);
      setTopOpportunities(data.topOpportunities);
      setCommonProblems(data.commonProblems);
      setTopFeatures(data.topFeatures);
      setRecentInsights(data.recentInsights);
      setResearchResults(data.researchResults);
      setActivityFeed(data.activityFeed);
      setError(null);
    } catch {
      setError("Failed to load dashboard data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const previousProductRef = useRef("");
  const loaded = useRef(false);
  useEffect(() => {
    const currentProduct = localStorage.getItem("active-product") || "";
    if (currentProduct !== previousProductRef.current) {
      previousProductRef.current = currentProduct;
      setLoading(true);
      fetchData();
    } else if (!loaded.current) {
      loaded.current = true;
      fetchData();
    }
  }, [fetchData]);
  useEffect(() => {
    const refresh = () => { setLoading(true); fetchData(); };
    window.addEventListener("active-product-changed", refresh);
    return () => window.removeEventListener("active-product-changed", refresh);
  }, [fetchData]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle size={28} className="text-[var(--warning)]" />
        <p className="text-sm text-[var(--text-secondary)]">{error}</p>
        <Button variant="primary" size="sm" onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} />
      </div>
    );
  }

  const isBlank = stats.totalInsights === 0 && stats.totalOpportunities === 0;

  return (
    <div className="mx-auto max-w-6xl animate-fadein">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[.16em] text-[var(--accent)]"><BrainCircuit size={15} />Signal overview</div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">What should you learn next?</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">A living view of customer signals, opportunities, and experiments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const allRecommendations = researchResults
                .filter((r) => r.recommendations.length > 0)
                .map((r) => `## ${r.product}\n\n${r.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}`)
                .join("\n\n");
              if (allRecommendations.length === 0) return;
              const content = `# Detailed Recommendations\n\n${allRecommendations}\n\n---\n*Generated by Product Discovery Agent*`;
              const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "detailed-recommendations.md";
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={!researchResults.some((r) => r.recommendations.length > 0)}
          >
            <Download size={15} /> Download recommendations
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              try {
                const res = await fetch("/api/export");
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "discovery-backup.json";
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                // silently ignore
              }
            }}
          >
            <FileDown size={15} /> Download backup
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <StatCard Icon={Lightbulb} label="Insights" value={stats.totalInsights} href="/discover" />
        <StatCard Icon={Target} label="Opportunities" value={stats.totalOpportunities} href="/opportunities" tone="data" />
        <StatCard Icon={Users} label="Personas" value={stats.totalPersonas} href="/personas" />
        <StatCard Icon={MessageSquare} label="Interviews" value={stats.totalInterviews} href="/interviews" tone="data" />
        <StatCard Icon={Sparkles} label="Features" value={stats.totalFeatures} href="/features" />
        <StatCard Icon={FlaskConical} label="Experiments" value={stats.totalExperiments} href="/experiments" tone="data" />
        <StatCard Icon={ShieldQuestion} label="Assumptions" value={stats.totalAssumptions} href="/assumptions" />
      </div>

      {isBlank ? (
        <Card className="border-dashed p-10 text-center">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]"><Sparkles size={22} /></div>
          <h2 className="font-display text-base font-semibold mb-2">Start with a customer signal</h2>
          <p className="mx-auto max-w-md text-sm text-[var(--text-secondary)]">
            Start by adding customer feedback, ideas, or interview notes in the Discover section. The system will automatically analyze your inputs and this dashboard will populate with insights.
          </p><Link href="/discover" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)]">Capture an insight <ArrowUpRight size={15} /></Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Opportunities */}
          <div>
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Top Opportunities
            </h2>
            <div className="space-y-2">
              {topOpportunities.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)]">No opportunities scored yet.</p>
              ) : (
                topOpportunities.map((opp) => (
                  <Card key={opp.id} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium truncate">{opp.title}</span>
                          <PriorityBadge priority={opp.priority} />
                        </div>
                      </div>
                      <span className="text-xs font-mono font-semibold">{opp.totalScore}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Most Common Themes */}
          <div>
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Emerging Themes
            </h2>
            <div className="space-y-2">
              {commonProblems.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)]">No themes detected yet.</p>
              ) : (
                commonProblems.map(({ theme, count }) => (
                  <Card key={theme} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">{theme}</span>
                      <Badge variant="accent">{count} mentions</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Top Features */}
          <div>
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Highest Priority Features
            </h2>
            <div className="space-y-2">
              {topFeatures.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)]">No features prioritized yet.</p>
              ) : (
                topFeatures.map((feat) => (
                  <Card key={feat.id} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{feat.title}</span>
                          <Badge variant="accent">{feat.framework.toUpperCase()}</Badge>
                          <PriorityBadge priority={feat.priority} />
                        </div>
                      </div>
                      <span className="text-xs font-mono font-semibold">{feat.totalScore}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Recent Insights */}
          <div>
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Recent Insights
            </h2>
            <div className="space-y-2">
              {recentInsights.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)]">No insights recorded yet.</p>
              ) : (
                recentInsights.map((insight) => (
                  <Card key={insight.id} className="p-3">
                    <p className="text-sm line-clamp-2">{insight.description}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        {new Date(insight.createdAt).toLocaleDateString()}
                      </span>
                      <Badge variant="default">{insight.source.replace(/_/g, " ")}</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Feed */}
      {!isBlank && activityFeed.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Activity Feed
          </h2>
          <div className="space-y-1.5">
            {activityFeed.map((item, i) => (
              <div key={`${item.type}-${i}`} className="flex items-center gap-2 py-1.5 px-1 text-sm">
                <span className="text-base shrink-0">{ENTITY_ICONS[item.type] ?? "\uD83D\uDCC4"}</span>
                <span className="flex-1 truncate">{item.title}</span>
                <Badge variant="default">{item.type}</Badge>
                <span className="text-xs text-[var(--text-tertiary)] shrink-0">{relativeTime(item.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
