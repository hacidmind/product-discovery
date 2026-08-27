"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge, Spinner } from "@/components/ui";
import type {
  Insight, Opportunity, Persona, Interview, Feature, Experiment, Assumption,
} from "@/lib/types";

interface SearchResult {
  type: string;
  id: string;
  title: string;
  excerpt: string;
  score: number;
  icon: string;
}

// Simple fuzzy match scoring
function scoreMatch(text: string, query: string): number {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();

  if (lower === q) return 100;
  if (lower.startsWith(q)) return 80;
  if (lower.includes(q)) return 60;

  // Word match bonus
  const words = q.split(/\s+/);
  let wordScore = 0;
  for (const word of words) {
    if (word.length < 2) continue;
    if (lower.includes(word)) wordScore += 30;
  }

  // Tag/title match
  if (wordScore > 0) return wordScore;

  return 0;
}

const TYPE_ICONS: Record<string, string> = {
  insight: "💡",
  opportunity: "◆",
  persona: "👤",
  interview: "💬",
  feature: "⚡",
  experiment: "🔬",
  assumption: "❓",
};

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<{
    insights: Insight[];
    opportunities: Opportunity[];
    personas: Persona[];
    interviews: Interview[];
    features: Feature[];
    experiments: Experiment[];
    assumptions: Assumption[];
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all data on mount
  useEffect(() => {
    async function load() {
      const [insights, opportunities, personas, interviews, features, experiments, assumptions] =
        await Promise.all([
          fetch("/api/insights").then((r) => r.json()),
          fetch("/api/opportunities").then((r) => r.json()),
          fetch("/api/personas").then((r) => r.json()),
          fetch("/api/interviews").then((r) => r.json()),
          fetch("/api/features").then((r) => r.json()),
          fetch("/api/experiments").then((r) => r.json()),
          fetch("/api/assumptions").then((r) => r.json()),
        ]);
      setData({ insights, opportunities, personas, interviews, features, experiments, assumptions });
    }
    load();
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search as you type (derived at render time; data is in-memory)
  const results = useMemo(() => {
    if (!data || !query.trim()) return [];
    const found: SearchResult[] = [];

      for (const insight of data.insights) {
        const score = scoreMatch(insight.description + " " + insight.title + " " + insight.tags.join(" "), query);
        if (score > 0) {
          found.push({
            type: "insight", id: insight.id,
            title: insight.title,
            excerpt: insight.description.slice(0, 150),
            score,
            icon: TYPE_ICONS.insight,
          });
        }
      }

      for (const opp of data.opportunities) {
        const score = scoreMatch(opp.title + " " + opp.description, query);
        if (score > 0) {
          found.push({
            type: "opportunity", id: opp.id,
            title: opp.title,
            excerpt: opp.description.slice(0, 150),
            score, icon: TYPE_ICONS.opportunity,
          });
        }
      }

      for (const persona of data.personas) {
        const score = scoreMatch(
          persona.name + " " + persona.role + " " + persona.goals.join(" ") + " " + persona.frustrations.join(" "),
          query
        );
        if (score > 0) {
          found.push({
            type: "persona", id: persona.id,
            title: persona.name,
            excerpt: `${persona.role} · ${persona.frustrations.slice(0, 2).join(", ")}`,
            score, icon: TYPE_ICONS.persona,
          });
        }
      }

      for (const interview of data.interviews) {
        const score = scoreMatch(
          interview.title + " " + interview.transcript + " " + interview.interviewee,
          query
        );
        if (score > 0) {
          found.push({
            type: "interview", id: interview.id,
            title: interview.title,
            excerpt: `With ${interview.interviewee} · ${interview.transcript.slice(0, 120)}...`,
            score, icon: TYPE_ICONS.interview,
          });
        }
      }

      for (const feature of data.features) {
        const score = scoreMatch(feature.title + " " + feature.description, query);
        if (score > 0) {
          found.push({
            type: "feature", id: feature.id,
            title: feature.title,
            excerpt: `${feature.framework.toUpperCase()} · ${feature.description.slice(0, 150)}`,
            score, icon: TYPE_ICONS.feature,
          });
        }
      }

      for (const exp of data.experiments) {
        const score = scoreMatch(exp.title + " " + exp.hypothesis, query);
        if (score > 0) {
          found.push({
            type: "experiment", id: exp.id,
            title: exp.title,
            excerpt: exp.hypothesis.slice(0, 150),
            score, icon: TYPE_ICONS.experiment,
          });
        }
      }

      for (const assumption of data.assumptions) {
        const score = scoreMatch(assumption.statement + " " + assumption.evidence, query);
        if (score > 0) {
          found.push({
            type: "assumption", id: assumption.id,
            title: assumption.statement,
            excerpt: `${assumption.area} · ${assumption.evidence.slice(0, 120)}`,
            score, icon: TYPE_ICONS.assumption,
          });
        }
      }

    found.sort((a, b) => b.score - a.score);
    return found.slice(0, 30);
  }, [data, query]);

  // Group results by type
  const grouped = new Map<string, SearchResult[]>();
  for (const r of results) {
    if (!grouped.has(r.type)) grouped.set(r.type, []);
    grouped.get(r.type)!.push(r);
  }

  const navigateToResult = (result: SearchResult) => {
    const typeRoutes: Record<string, string> = {
      insight: "/discover",
      opportunity: "/opportunities",
      persona: "/personas",
      interview: "/interviews",
      feature: "/features",
      experiment: "/experiments",
      assumption: "/assumptions",
    };
    router.push(typeRoutes[result.type] || "/dashboard");
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadein">
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight mb-3">Search</h1>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search insights, opportunities, personas, interviews, features..."
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] pl-9 pr-4 py-2.5 text-sm
              text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-2">
          Searches across all your product discovery data. Results appear as you type.
        </p>
      </div>

      {data === null ? (
        <div className="flex items-center justify-center py-10">
          <Spinner size={20} />
        </div>
      ) : query.trim() && results.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-2xl mb-2">🔍</div>
          <p className="text-sm text-[var(--text-secondary)]">No results found for &ldquo;{query}&rdquo;</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([type, items]) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2">
                <span>{TYPE_ICONS[type]}</span>
                <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  {type}s ({items.length})
                </h2>
              </div>
              <div className="space-y-2">
                {items.map((result) => (
                  <Card key={result.id} className="p-3" onClick={() => navigateToResult(result)}>
                    <div className="flex items-start gap-3">
                      <span className="text-sm shrink-0 mt-0.5">{result.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium">{result.title}</span>
                          <Badge variant="accent">{result.type}</Badge>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                          {result.excerpt}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : !query.trim() ? (
        <div className="text-center py-12">
          <div className="text-2xl mb-2">⌨️</div>
          <p className="text-sm text-[var(--text-secondary)]">
            Type to search across insights, opportunities, personas, interviews, features, experiments, and assumptions.
          </p>
        </div>
      ) : null}
    </div>
  );
}