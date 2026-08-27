// ─── Analysis Utilities ─────────────────────────────────────────────
//
// These are deterministic, rule-based functions that perform the "AI" analysis.
// No external APIs required. All logic is transparent and debuggable.
//
// For each function, there's also a pluggable interface definition so that
// an LLM could be swapped in later without changing the rest of the app.

import type { InsightCategory, Emotion, OpportunityScore, Priority, AssumptionArea } from "./types";

// ─── Stop Words for Keyword Extraction ──────────────────────────────

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "can", "shall", "you", "your",
  "i", "my", "me", "we", "our", "us", "they", "them", "their", "it",
  "its", "this", "that", "these", "those", "not", "no", "very", "just",
  "really", "so", "if", "then", "than", "too", "also", "about", "like",
  "get", "got", "make", "made", "go", "went", "come", "came", "know",
  "think", "thing", "things", "people", "time", "way", "day", "good",
  "bad", "new", "old", "big", "small", "more", "less", "much", "many",
  "some", "any", "all", "every", "each", "other", "only", "own", "same",
  "different", "another", "such", "here", "there", "when", "where",
  "what", "which", "who", "how", "why", "one", "two", "first", "last",
]);

// ─── Pain Point Keywords ────────────────────────────────────────────

const PAIN_KEYWORDS = [
  "frustrating", "frustrated", "annoying", "difficult", "hard", "impossible",
  "confusing", "complicated", "slow", "broken", "bug", "crash", "error",
  "problem", "issue", "pain", "struggle", "hate", "terrible", "awful",
  "waste", "can't", "cannot", "won't", "doesn't", "never", "always",
  "manual", "tedious", "boring", "repetitive", "workaround", "hack",
  "expensive", "costly", "ugly", "clunky", "outdated",
];

// ─── Sentiment Analysis (rule-based) ────────────────────────────────

export function analyzeSentiment(text: string): Emotion {
  const lower = text.toLowerCase();

  const positiveWords = ["love", "great", "excellent", "amazing", "wonderful", "fantastic", "helpful", "easy", "intuitive", "fast", "efficient"];
  const negativeWords = ["frustrating", "annoying", "terrible", "awful", "hate", "broken", "confusing", "slow", "ugly", "useless", "painful"];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveWords) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    positiveCount += (lower.match(regex) || []).length;
  }

  for (const word of negativeWords) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    negativeCount += (lower.match(regex) || []).length;
  }

  if (positiveCount > negativeCount * 1.5) return "positive";
  if (negativeCount > positiveCount * 1.5) return "negative";
  if (positiveCount > 0 && negativeCount > 0) return "mixed";
  return "neutral";
}

// ─── Extract Keywords ───────────────────────────────────────────────

export function extractKeywords(text: string, maxKeywords = 10): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
  const freq = new Map<string, number>();

  for (const word of words) {
    if (word.length < 3 || STOP_WORDS.has(word)) continue;
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

// ─── Detect Themes ──────────────────────────────────────────────────

const THEME_PATTERNS: Record<string, RegExp[]> = {
  onboarding: [/\bonboarding\b/i, /\bsignup\b/i, /\bregistration\b/i, /\bgetting started\b/i],
  navigation: [/\bnavigation\b/i, /\bmenu\b/i, /\bfind\b/i, /\bsearch\b/i, /\bbrowse\b/i],
  performance: [/\bslow\b/i, /\bperformance\b/i, /\bcrash\b/i, /\blag\b/i, /\bwaiting\b/i, /\bloading\b/i],
  pricing: [/\bprice\b/i, /\bpricing\b/i, /\bcost\b/i, /\bexpensive\b/i, /\bcheap\b/i, /\bpayment\b/i],
  support: [/\bsupport\b/i, /\bhelp\b/i, /\bcustomer service\b/i, /\brespons\b/i],
  mobile: [/\bmobile\b/i, /\bphone\b/i, /\bapp\b/i, /\bandroid\b/i, /\bios\b/i, /\btablet\b/i],
  integration: [/\bintegrat\b/i, /\bapi\b/i, /\bconnect\b/i, /\bsync\b/i, /\bimport\b/i, /\bexport\b/i],
  ux: [/\bux\b/i, /\bui\b/i, /\bdesign\b/i, /\binterface\b/i, /\bclunky\b/i, /\bugly\b/i],
  data: [/\bdata\b/i, /\breport\b/i, /\banalytics\b/i, /\bdashboard\b/i, /\bmetric\b/i],
  security: [/\bsecurity\b/i, /\bprivacy\b/i, /\bpermission\b/i, /\bauth\b/i],
  collaboration: [/\bcollaborat\b/i, /\bshare\b/i, /\bteam\b/i, /\bcomment\b/i],
  notifications: [/\bnotif\b/i, /\balert\b/i, /\bemail\b/i, /\bremind\b/i],
};

export function detectThemes(text: string): string[] {
  const themes: string[] = [];
  for (const [theme, patterns] of Object.entries(THEME_PATTERNS)) {
    if (patterns.some((p) => p.test(text))) {
      themes.push(theme);
    }
  }
  return themes;
}

// ─── Classify Insight Category ──────────────────────────────────────

export function classifyInsight(text: string): InsightCategory {
  const lower = text.toLowerCase();

  if (PAIN_KEYWORDS.some((k) => lower.includes(k))) return "pain_point";
  if (/\bfeature request\b/i.test(lower) || /\badd\b/i.test(lower) || /\bwant\b/i.test(lower) || /\bneed\b/i.test(lower) || /\bwould be nice\b/i.test(lower)) return "feature_request";
  if (/\bassum\b/i.test(lower) || /\bthink\b/i.test(lower) || /\bbelieve\b/i.test(lower) || /\bprobably\b/i.test(lower)) return "assumption";
  if (/\bopportunity\b/i.test(lower) || /\bcould\b/i.test(lower) || /\bpotential\b/i.test(lower)) return "opportunity";
  if (/\bnot sure\b/i.test(lower) || /\bunknown\b/i.test(lower) || /\bwonder\b/i.test(lower)) return "unknown";
  return "problem";
}

// ─── Score an Opportunity ───────────────────────────────────────────

export function scoreOpportunity(
  scores: OpportunityScore
): { totalScore: number; priority: Priority; reasoning: string } {
  const { impact, frequency, urgency, businessValue, strategicAlignment, confidence } = scores;

  // Weighted average (out of 10)
  const rawScore =
    (impact * 0.25 +
      frequency * 0.20 +
      urgency * 0.15 +
      businessValue * 0.20 +
      strategicAlignment * 0.20) *
    (confidence / 10);

  const totalScore = Math.round(rawScore * 10) / 10;

  let priority: Priority;
  if (totalScore >= 7.5) priority = "critical";
  else if (totalScore >= 5.5) priority = "high";
  else if (totalScore >= 3.5) priority = "medium";
  else priority = "low";

  const reasoningParts: string[] = [];

  if (impact >= 8) reasoningParts.push(`High impact (${impact}/10)`);
  if (frequency >= 8) reasoningParts.push(`Frequently reported (${frequency}/10)`);
  if (urgency >= 8) reasoningParts.push(`Urgent (${urgency}/10)`);
  if (businessValue >= 8) reasoningParts.push(`Strong business value (${businessValue}/10)`);
  if (strategicAlignment >= 8) reasoningParts.push(`Well aligned with strategy (${strategicAlignment}/10)`);
  if (confidence <= 4) reasoningParts.push(`Low confidence (${confidence}/10) — needs validation`);

  if (reasoningParts.length === 0) {
    reasoningParts.push(`Moderate scores across all dimensions — consider further analysis`);
  }
  if (confidence <= 3) {
    reasoningParts.push(`HIGH UNCERTAINTY — validate before committing resources`);
  }

  return {
    totalScore,
    priority,
    reasoning: reasoningParts.join(". "),
  };
}

// ─── RICE Scoring ───────────────────────────────────────────────────

export function scoreRICE(
  reach: number,
  impact: number,
  confidence: number,
  effort: number
): number {
  if (effort === 0) return 0;
  return Math.round(((reach * impact * confidence) / effort) * 100) / 100;
}

// ─── ICE Scoring ────────────────────────────────────────────────────

export function scoreICE(
  impact: number,
  confidence: number,
  ease: number
): number {
  return Math.round(((impact + confidence + ease) / 3) * 100) / 100;
}

// ─── Classify Assumption ────────────────────────────────────────────

const ASSUMPTION_CLASSIFIERS: Record<AssumptionArea, RegExp[]> = {
  desirability: [/\buser\b/i, /\bwant\b/i, /\bneed\b/i, /\bdesire\b/i, /\bcustomer\b/i, /\bpersona\b/i, /\bbehavio/i],
  feasibility: [/\bbuild\b/i, /\btech\b/i, /\bengineer\b/i, /\btechnical\b/i, /\bresource\b/i, /\btime\b/i, /\bskill\b/i],
  viability: [/\brevenue\b/i, /\bprofit\b/i, /\bbusiness\b/i, /\bmarket\b/i, /\bsustainable\b/i, /\bscal\b/i, /\broi\b/i],
  usability: [/\buse\b/i, /\binterface\b/i, /\bdesign\b/i, /\bux\b/i, /\bclick\b/i, /\bflow\b/i, /\bexperience\b/i],
  risk: [/\brisk\b/i, /\bdanger\b/i, /\blegal\b/i, /\bcompliance\b/i, /\bsecurity\b/i, /\bfail\b/i],
  unknown: [],
};

export function classifyAssumption(text: string): AssumptionArea {
  for (const [area, patterns] of Object.entries(ASSUMPTION_CLASSIFIERS)) {
    if (area === "unknown") continue;
    if (patterns.some((p) => p.test(text))) return area as AssumptionArea;
  }
  return "unknown";
}

// ─── Extract Quotes from Text ───────────────────────────────────────

export function extractQuotes(text: string): string[] {
  // Extract sentences in quotes
  const quoteRegex = /"([^"]+)"/g;
  const matches = text.matchAll(quoteRegex);
  return Array.from(matches).map((m) => m[1]).filter((q) => q.length > 5);
}

// ─── Pluggable AI Interface ─────────────────────────────────────────
//
// If you want to add an LLM later, implement this interface.
// The rest of the app calls `ai.someMethod()` so you only need to
// swap the implementation in one place.

export interface AIProvider {
  analyzeSentiment(text: string): Promise<Emotion>;
  extractKeywords(text: string): Promise<string[]>;
  detectThemes(text: string): Promise<string[]>;
  classifyInsight(text: string): Promise<InsightCategory>;
  scoreOpportunity(scores: OpportunityScore): Promise<{ totalScore: number; priority: Priority; reasoning: string }>;
  classifyAssumption(text: string): Promise<AssumptionArea>;
}

// Default: use the deterministic functions above
export const ai: AIProvider = {
  analyzeSentiment: async (text) => analyzeSentiment(text),
  extractKeywords: async (text) => extractKeywords(text),
  detectThemes: async (text) => detectThemes(text),
  classifyInsight: async (text) => classifyInsight(text),
  scoreOpportunity: async (scores) => scoreOpportunity(scores),
  classifyAssumption: async (text) => classifyAssumption(text),
};