import type { Experiment, Feature, Insight, Opportunity, TreeGuidance, TreeNode } from "@/lib/types";
import { extractKeywords } from "@/lib/analysis";

export interface TreeSuggestion {
  key: string;
  type: TreeNode["type"];
  label: string;
  guidance: TreeGuidance;
  opportunityId?: string;
  featureId?: string;
  experimentId?: string;
  insightId?: string;
}
export interface TreeContext {
  insights: Insight[];
  opportunities: Opportunity[];
  features: Feature[];
  experiments: Experiment[];
}

const short = (text: string, length = 120) => text.replace(/\s+/g, " ").trim().slice(0, length);
const normalized = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
function relevance(text: string, target: string): number {
  const words = new Set(extractKeywords(target, 30));
  return extractKeywords(text, 30).filter(word => words.has(word)).length;
}
function draft(key: string, type: TreeNode["type"], label: string, rationale: string, extra: Partial<TreeGuidance> = {}): TreeSuggestion {
  return { key, type, label: short(label, 200), guidance: { basis: "starter", rationale, ...extra } };
}

export function getTreeSuggestions(selected: TreeNode | null, context: TreeContext): TreeSuggestion[] {
  const { insights, opportunities, features, experiments } = context;
  let candidates: TreeSuggestion[] = [];
  if (!selected) {
    const themes = new Set(insights.flatMap(insight => insight.themes || []));
    if (themes.has("onboarding")) candidates.push(draft("outcome-onboarding", "outcome", "Increase new-customer activation from [baseline] to [target] by [date]", "Your insights mention onboarding. Choose an activation event and measure its current completion rate."));
    if (themes.has("performance")) candidates.push(draft("outcome-speed", "outcome", "Reduce time to complete [key task] from [baseline] to [target] by [date]", "Your insights mention performance. Measure a customer task, then choose a realistic target."));
    candidates.push(
      draft("outcome-completion", "outcome", "Increase [customer segment] completing [key task] from [baseline] to [target] by [date]", "Start with a customer behavior you can measure. Replace the brackets with your segment, task, baseline, target, and date."),
      draft("outcome-retention", "outcome", "Increase returning [customer segment] from [baseline] to [target] by [date]", "Use retention when repeat value matters. Choose a return interval and establish a baseline before setting a target."),
      draft("outcome-effort", "outcome", "Reduce time spent on [customer task] from [baseline] to [target] by [date]", "Use task time when customers struggle with effort or delays. Observe the current workflow first."),
    );
  } else if (selected.type === "outcome") {
    candidates = [...opportunities].sort((a, b) => relevance(b.title + " " + b.description, selected.label) - relevance(a.title + " " + a.description, selected.label) || b.totalScore - a.totalScore).map(item => ({
      key: `opportunity-${item.id}`, type: "opportunity", label: short(item.title, 200), opportunityId: item.id,
      guidance: { basis: "workspace", rationale: "An existing opportunity in this workspace. Check that solving this customer need would move your chosen outcome.", evidence: short(item.description, 1200) },
    }));
    candidates.push(...insights.filter(item => ["pain_point", "problem", "opportunity"].includes(item.category)).sort((a, b) => relevance(b.description, selected.label) - relevance(a.description, selected.label)).map((item): TreeSuggestion => ({
      key: `insight-${item.id}`, type: "opportunity", label: short(item.title || item.description, 200), insightId: item.id,
      guidance: { basis: "workspace", rationale: "A customer signal from your workspace. Review the wording as a need or obstacle before treating it as an opportunity.", evidence: short(item.description, 1200) },
    })));
    candidates.push(
      draft("opportunity-friction", "opportunity", "Customers may struggle to complete the key task without help", `A starting hypothesis for “${short(selected.label, 100)}”. Ask customers about the last time they attempted the task.`, { assumption: "Customers encounter a meaningful obstacle during the task." }),
      draft("opportunity-value", "opportunity", "Customers may be unsure whether the product meets their needs", "Explore what customers expect and what they actually experience. Confirm the need in interviews before building a solution.", { assumption: "Uncertainty about value prevents the desired customer behavior." }),
    );
  } else if (selected.type === "opportunity") {
    candidates = features.filter(item => (selected.opportunityId && item.relatedOpportunityIds?.includes(selected.opportunityId)) || relevance(item.title + " " + item.description, selected.label) >= 2).sort((a, b) => Number(!!selected.opportunityId && b.relatedOpportunityIds?.includes(selected.opportunityId)) - Number(!!selected.opportunityId && a.relatedOpportunityIds?.includes(selected.opportunityId))).map(item => ({
      key: `feature-${item.id}`, type: "solution", label: short(item.title, 200), featureId: item.id,
      guidance: { basis: "workspace", rationale: item.relatedOpportunityIds?.includes(selected.opportunityId || "") ? "This feature is already linked to the selected opportunity." : "This feature shares terms with this opportunity. Check that it addresses the same need.", evidence: short(item.description, 1200) },
    }));
    const topic = short(selected.label, 90);
    const onboarding = /setup|onboard|start|activation|guid/i.test(selected.label);
    candidates.push(
      draft("solution-guidance", "solution", onboarding ? "Guide customers through setup with a short checklist" : `Provide in-context guidance for: ${topic}`, "Explore a small change that helps customers understand their next action.", { assumption: "Customers struggle because the next step is unclear." }),
      draft("solution-simplify", "solution", `Simplify the workflow for: ${topic}`, "Compare removing steps with adding a new feature. Sketch two alternatives before choosing one.", { assumption: "Reducing effort will make the customer task easier to complete." }),
      draft("solution-concierge", "solution", `Offer a manual assisted path for: ${topic}`, "Deliver the proposed value by hand first to learn whether it addresses the need before automating it.", { assumption: "Customers value the proposed help enough to use it." }),
    );
  } else if (selected.type === "solution") {
    candidates = experiments.filter(item => relevance(item.title + " " + item.hypothesis, selected.label) >= 2).map(item => ({
      key: `experiment-${item.id}`, type: "experiment", label: short(item.title, 200), experimentId: item.id,
      guidance: { basis: "workspace", rationale: "An existing experiment with similar wording. Verify its hypothesis tests this solution.", assumption: short(item.hypothesis, 1200), successSignal: short(item.metrics?.successMetric || "Define a decision threshold before running this test.", 1200) },
    }));
    const topic = short(selected.label, 95);
    candidates.push(
      draft("experiment-prototype", "experiment", `Prototype test: ${topic}`, "Test the riskiest usability assumption before implementation.", { assumption: selected.guidance?.assumption || "Customers can use this solution to complete the intended task without help.", testPlan: "Create a lightweight prototype. Invite five target customers, give them a realistic task, and observe completion and confusion without coaching.", successSignal: "Set a completion threshold before testing. Record completion, assistance needed, and where participants hesitate; use the results to revise or reject the idea." }),
      draft("experiment-concierge", "experiment", `Manual pilot: ${topic}`, "Test whether the outcome is valuable before investing in automation.", { assumption: "The proposed solution delivers value customers want to use again.", testPlan: "Offer the service manually to a small group of target customers. Compare their task effort with the current approach and ask whether they would use it again.", successSignal: "Define the minimum useful improvement and repeat-use signal before the pilot. Compare the observations with that threshold." }),
      draft("experiment-feasibility", "experiment", `Feasibility spike: ${topic}`, "Check a technical uncertainty that could prevent the solution from working.", { assumption: "The critical technical dependency can meet the needs of this solution.", testPlan: "Identify the riskiest dependency, timebox a small proof of concept, and measure it against the required constraints.", successSignal: "Agree on the required performance, accuracy, or integration constraint first. Record whether the spike meets it and what remains unknown." }),
    );
  }
  const existing = selected?.children || [];
  const labels = new Set(existing.map(node => normalized(node.label)));
  return candidates.filter(candidate => {
    if (labels.has(normalized(candidate.label)) || existing.some(node =>
      (candidate.opportunityId && node.opportunityId === candidate.opportunityId) || (candidate.featureId && node.featureId === candidate.featureId) ||
      (candidate.experimentId && node.experimentId === candidate.experimentId) || (candidate.insightId && node.insightId === candidate.insightId))) return false;
    labels.add(normalized(candidate.label));
    return true;
  }).slice(0, 4);
}

export function suggestionToNode(suggestion: TreeSuggestion, id: string): TreeNode {
  const { key: _key, ...node } = suggestion;
  void _key;
  return { ...node, id, children: [], expanded: true };
}
