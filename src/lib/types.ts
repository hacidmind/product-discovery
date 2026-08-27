// ─── Core Data Types ───────────────────────────────────────────────

export type InsightSource =
  | "customer_complaint"
  | "interview"
  | "feature_request"
  | "sales_feedback"
  | "support_ticket"
  | "idea"
  | "other";

export type InsightCategory =
  | "problem"
  | "pain_point"
  | "feature_request"
  | "assumption"
  | "opportunity"
  | "unknown";

export type Emotion = "positive" | "negative" | "neutral" | "mixed";

export type Priority = "critical" | "high" | "medium" | "low";

export type MoSCoW = "must" | "should" | "could" | "wont";

export type KanoCategory =
  | "basic"
  | "performance"
  | "delight"
  | "indifferent"
  | "reverse";

export type AssumptionArea =
  | "desirability"
  | "feasibility"
  | "viability"
  | "usability"
  | "risk"
  | "unknown";

export type ExperimentStatus = "planned" | "running" | "completed";

export type Framework = "rice" | "ice" | "moscow" | "kano" | "weighted";

export interface Product {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  researchCount?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

// ─── Insight ────────────────────────────────────────────────────────

export interface Insight {
  id: string;
  productId?: string;
  title: string;
  description: string;
  source: InsightSource;
  category: InsightCategory;
  emotion: Emotion;
  tags: string[];
  themes: string[];
  quotes: string[];
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  interviewId?: string;
}

// ─── Opportunity ────────────────────────────────────────────────────

export interface OpportunityScore {
  impact: number;        // 1-10
  frequency: number;     // 1-10
  urgency: number;       // 1-10
  businessValue: number; // 1-10
  strategicAlignment: number; // 1-10
  confidence: number;    // 1-10
}

export interface Opportunity {
  id: string;
  productId?: string;
  title: string;
  description: string;
  scores: OpportunityScore;
  totalScore: number;
  priority: Priority;
  reasoning: string;
  relatedInsightIds: string[];
  status: "new" | "exploring" | "validated" | "building" | "shipped";
  createdAt: string;
  updatedAt: string;
}

// ─── Persona ────────────────────────────────────────────────────────

export interface Persona {
  id: string;
  productId?: string;
  name: string;
  role: string;
  demographics: string;
  goals: string[];
  frustrations: string[];
  behaviors: string[];
  needs: string[];
  quotes: string[];
  jobsToBeDone: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Interview ──────────────────────────────────────────────────────

export interface InterviewAnalysis {
  painPoints: string[];
  featureRequests: string[];
  emotions: { emotion: Emotion; quote: string }[];
  repeatedThemes: { theme: string; count: number }[];
  opportunities: string[];
  unknowns: string[];
  assumptions: string[];
}

export interface Interview {
  id: string;
  productId?: string;
  title: string;
  transcript: string;
  interviewee: string;
  date: string;
  analysis: InterviewAnalysis;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Feature ────────────────────────────────────────────────────────

export interface FeatureScores {
  // RICE
  reach?: number;
  impact?: number;
  confidence?: number;
  effort?: number;

  // ICE
  iceImpact?: number;
  iceConfidence?: number;
  iceEase?: number;

  // Weighted
  weights?: Record<string, number>;

  // MoSCoW
  moscow?: MoSCoW;

  // Kano
  kano?: KanoCategory;
}

export interface Feature {
  id: string;
  productId?: string;
  title: string;
  description: string;
  framework: Framework;
  scores: FeatureScores;
  totalScore: number;
  priority: Priority;
  status: "backlog" | "next" | "in_progress" | "done";
  relatedOpportunityIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Assumption ─────────────────────────────────────────────────────

export interface Assumption {
  id: string;
  productId?: string;
  statement: string;
  area: AssumptionArea;
  risk: "low" | "medium" | "high" | "critical";
  evidence: string;
  validationStatus: "untested" | "testing" | "validated" | "invalidated";
  relatedExperimentIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Experiment ─────────────────────────────────────────────────────

export interface ExperimentMetrics {
  successMetric: string;
  failureMetric: string;
  baselineValue?: string;
  targetValue?: string;
}

export interface Experiment {
  id: string;
  productId?: string;
  title: string;
  hypothesis: string;
  metrics: ExperimentMetrics;
  duration: string;
  cost: string;
  risk: "low" | "medium" | "high";
  expectedLearning: string;
  status: ExperimentStatus;
  results?: string;
  relatedAssumptionIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Opportunity Solution Tree ──────────────────────────────────────

export interface TreeNode {
  id: string;
  productId?: string;
  label: string;
  type: "outcome" | "opportunity" | "solution" | "experiment";
  children: TreeNode[];
  opportunityId?: string;
  experimentId?: string;
  expanded: boolean;
}

// ─── Dashboard ──────────────────────────────────────────────────────

export interface DashboardStats {
  totalInsights: number;
  totalOpportunities: number;
  totalPersonas: number;
  totalInterviews: number;
  totalFeatures: number;
  totalExperiments: number;
  topOpportunities: Opportunity[];
  commonProblems: { theme: string; count: number }[];
  highestPriorityFeatures: Feature[];
  opportunityTrends: { month: string; count: number }[];
}

// ─── Search ─────────────────────────────────────────────────────────

export interface SearchResult {
  type: "insight" | "opportunity" | "persona" | "interview" | "feature" | "experiment" | "assumption";
  id: string;
  title: string;
  excerpt: string;
  score: number;
}

// ─── Research ────────────────────────────────────────────────────────

export interface ResearchQuery {
  id: string;
  query: string;
  product: string;
  category: "product" | "solution" | "market_insight" | "gap_analysis" | "competitor" | "trend";
  createdAt: string;
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}

export interface ResearchInsight {
  type: "key_finding" | "market_gap" | "opportunity" | "risk" | "trend" | "competitor_move";
  title: string;
  description: string;
  confidence: "high" | "medium" | "low";
  detail?: string;
  supportingEvidence?: string[];
  nextSteps?: string[];
  relatedQueries?: string[];
}

export interface CompetitorDetail {
  name: string;
  description: string;
  funding?: string;
  marketShare?: string;
  strengths?: string[];
  weaknesses?: string[];
  website?: string;
}

export interface MarketSizeDetail {
  total: string;
  growth: string;
  segments?: { name: string; value: string; share: string }[];
  regions?: { name: string; share: string }[];
  drivers?: string[];
  barriers?: string[];
}

export interface ResearchResult {
  id: string;
  productId?: string;
  query: string;
  product: string;
  category: ResearchQuery["category"];
  sources: ResearchSource[];
  summary: string;
  insights: ResearchInsight[];
  marketSize: string;
  marketSizeDetail?: MarketSizeDetail;
  competitors: string[];
  competitorDetails?: CompetitorDetail[];
  recommendations: string[];
  /** Research-specific working notes, kept separate from generated findings. */
  notes?: string;
  savedFile?: string;
  createdAt: string;
}
