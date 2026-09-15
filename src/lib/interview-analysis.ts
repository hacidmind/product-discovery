import { analyzeSentiment, detectThemes } from "@/lib/analysis";
import type { InterviewAnalysis } from "@/lib/types";

// Analyze a transcript and extract structured insights
export function analyzeTranscript(transcript: string): InterviewAnalysis {
  // Split into sentences for analysis
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 10);

  // Detect pain points — sentences with negative sentiment or pain keywords
  const painKeywords = ["frustrat", "annoy", "difficult", "hard", "confus", "slow", "broken", "bug", "crash", "error", "problem", "issue", "pain", "struggle", "hate", "terrible", "awful", "waste", "cannot", "can't", "doesn't", "won't", "manual", "tedious", "boring", "repetitive"];
  const painPoints = sentences
    .filter((s) => {
      const lower = s.toLowerCase();
      return painKeywords.some((k) => lower.includes(k));
    })
    .map((s) => s.trim())
    .slice(0, 10);

  // Detect feature requests
  const requestPatterns = [
    /\b(wish|want|need|would like|would love|should have|why (doesn't|can't)|if only|add|please|hope)\b/i,
  ];
  const featureRequests = sentences
    .filter((s) => requestPatterns.some((p) => p.test(s)))
    .map((s) => s.trim())
    .slice(0, 10);

  // Analyze emotions per sentence
  const emotions = sentences
    .map((s) => ({
      emotion: analyzeSentiment(s),
      quote: s.trim(),
    }))
    .filter((e) => e.emotion !== "neutral")
    .slice(0, 15);

  // Count repeated themes
  const themeCount = new Map<string, number>();
  for (const sentence of sentences) {
    const themes = detectThemes(sentence);
    for (const theme of themes) {
      themeCount.set(theme, (themeCount.get(theme) || 0) + 1);
    }
  }

  const repeatedThemes = Array.from(themeCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([theme, count]) => ({ theme, count }))
    .slice(0, 10);

  // Potential opportunities — sentences suggesting improvement
  const opportunityPatterns = [
    /\b(opportunit|potential|could be|better if|improve|enhance|optimize|streamline)\b/i,
  ];
  const opportunities = sentences
    .filter((s) => opportunityPatterns.some((p) => p.test(s)))
    .map((s) => s.trim())
    .slice(0, 10);

  // Unknowns — things the user doesn't know
  const unknownPatterns = [/\b(not sure|don't know|unsure|wonder|maybe|perhaps|might)\b/i];
  const unknowns = sentences
    .filter((s) => unknownPatterns.some((p) => p.test(s)))
    .map((s) => s.trim())
    .slice(0, 10);

  // Assumptions — things stated as facts without evidence
  const assumptionPatterns = [/\b(think|believe|assume|probably|likely|seem|appear|guess)\b/i];
  const assumptions = sentences
    .filter((s) => assumptionPatterns.some((p) => p.test(s)))
    .map((s) => s.trim())
    .slice(0, 10);

  return {
    painPoints,
    featureRequests,
    emotions,
    repeatedThemes,
    opportunities,
    unknowns,
    assumptions,
  };
}

