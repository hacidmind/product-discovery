const enums: Record<string, string[]> = {
  source: ["customer_complaint", "interview", "feature_request", "sales_feedback", "support_ticket", "idea", "other"],
  emotion: ["positive", "negative", "neutral", "mixed"],
  priority: ["critical", "high", "medium", "low"],
  framework: ["rice", "ice", "moscow", "kano", "weighted"],
  validationStatus: ["untested", "testing", "validated", "invalidated"],
  area: ["desirability", "feasibility", "viability", "usability", "risk", "unknown"],
  risk: ["low", "medium", "high", "critical"],
};
const lists = ["tags", "themes", "quotes", "goals", "frustrations", "behaviors", "needs", "jobsToBeDone", "relatedInsightIds", "relatedOpportunityIds", "relatedExperimentIds", "relatedAssumptionIds"];
const texts = ["id", "title", "name", "description", "statement", "evidence", "role", "demographics", "hypothesis", "results", "duration", "cost", "expectedLearning", "interviewee", "transcript", "date"];
export function validateRecordInput(entity: string, value: unknown, partial: boolean): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Send a valid record.";
  const body = value as Record<string, unknown>;
  const required = entity === "personas" ? "name" : entity === "assumptions" ? "statement" : entity === "interviews" ? "transcript" : entity === "insights" ? (body.description ? "description" : "title") : "title";
  if (!partial && (typeof body[required] !== "string" || !(body[required] as string).trim())) return `Please enter a ${required}.`;
  for (const key of texts) if (key in body && (typeof body[key] !== "string" || (body[key] as string).length > 100_000)) return `Invalid ${key}.`;
  for (const key of lists) if (key in body && (!Array.isArray(body[key]) || !(body[key] as unknown[]).every(item => typeof item === "string"))) return `${key} must be a list of text values.`;
  for (const [key, values] of Object.entries(enums)) if (key in body && !values.includes(String(body[key]))) return `Choose a valid ${key}.`;
  const statuses = entity === "features" ? ["backlog", "next", "in_progress", "done"] : entity === "experiments" ? ["planned", "running", "completed"] : entity === "opportunities" ? ["new", "exploring", "validated", "building", "shipped"] : null;
  if (statuses && "status" in body && !statuses.includes(String(body.status))) return "Choose a valid status.";
  if (entity === "experiments" && body.risk === "critical") return "Choose low, medium, or high risk.";
  if (required in body && typeof body[required] === "string" && !(body[required] as string).trim()) return `Please enter a ${required}.`;
  if (body.scores !== undefined) {
    if (!body.scores || typeof body.scores !== "object" || Array.isArray(body.scores)) return "Invalid scores.";
    for (const [key, score] of Object.entries(body.scores)) {
      if (key === "weights") {
        if (!score || typeof score !== "object" || Array.isArray(score) || Object.entries(score).some(([name, weight]) => !["reach", "impact", "confidence", "effort"].includes(name) || typeof weight !== "number" || !Number.isFinite(weight) || weight < 0 || weight > 1000000)) return "Weights must be non-negative numbers for reach, impact, confidence, or effort.";
        continue;
      }
      if (key === "moscow") { if (!["must", "should", "could", "wont"].includes(String(score))) return "Choose a valid MoSCoW priority."; continue; }
      if (key === "kano") { if (!["basic", "performance", "delight", "indifferent", "reverse"].includes(String(score))) return "Choose a valid Kano category."; continue; }
      if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 1000000) return "Scores must be non-negative numbers.";
    }
  }
  if (body.metrics !== undefined && (!body.metrics || typeof body.metrics !== "object" || Array.isArray(body.metrics) || Object.values(body.metrics).some(value => typeof value !== "string"))) return "Metrics must contain text values.";
  return null;
}
