import type { TreeNode, Opportunity, Feature } from "@/lib/types";

export const TREE_CHILD_TYPES: Record<TreeNode["type"], TreeNode["type"][]> = {
  outcome: ["opportunity"], opportunity: ["opportunity", "solution"], solution: ["experiment"], experiment: [],
};

export function parseTree(value: unknown): TreeNode {
  const ids = new Set<string>();
  let count = 0;
  function visit(input: unknown, depth: number): TreeNode {
    if (!input || typeof input !== "object" || depth > 12 || ++count > 500) throw new Error("Use a tree of up to 500 items and 12 levels.");
    const node = input as Record<string, unknown>;
    if (typeof node.id !== "string" || !node.id || node.id.length > 150 || ids.has(node.id)) throw new Error("Each tree item needs a unique ID.");
    ids.add(node.id);
    if (typeof node.label !== "string" || !node.label.trim() || node.label.length > 200) throw new Error("Give each item a title of 1 to 200 characters.");
    if (!["outcome", "opportunity", "solution", "experiment"].includes(String(node.type)) || !Array.isArray(node.children)) throw new Error("Invalid tree item.");
    const result: TreeNode = { id: node.id, label: node.label.trim(), type: node.type as TreeNode["type"], expanded: node.expanded !== false, children: node.children.map(child => visit(child, depth + 1)) };
    if (result.children.some(child => !TREE_CHILD_TYPES[result.type].includes(child.type))) throw new Error("Connect outcomes to opportunities, opportunities to solutions, and solutions to experiments.");
    if (node.guidance !== undefined) {
      const guidance = node.guidance as Record<string, unknown>;
      if (!guidance || typeof guidance !== "object" || !["workspace", "starter"].includes(String(guidance.basis)) || typeof guidance.rationale !== "string" || !guidance.rationale.trim()) throw new Error("Invalid suggestion context.");
      result.guidance = { basis: guidance.basis as "workspace" | "starter", rationale: guidance.rationale };
      for (const key of ["rationale", "evidence", "assumption", "testPlan", "successSignal"] as const) {
        if (guidance[key] !== undefined) {
          if (typeof guidance[key] !== "string" || guidance[key].length > 2000) throw new Error("Suggestion details must contain up to 2000 characters.");
          result.guidance[key] = guidance[key];
        }
      }
    }
    for (const key of ["opportunityId", "featureId", "experimentId", "insightId"] as const) if (typeof node[key] === "string") result[key] = node[key];
    return result;
  }
  const tree = visit(value, 0);
  if (tree.type !== "outcome") throw new Error("Start your tree with a desired outcome.");
  return tree;
}
export function mapTree(node: TreeNode, id: string, update: (node: TreeNode) => TreeNode): TreeNode {
  if (node.id === id) return update(node);
  return { ...node, children: node.children.map(child => mapTree(child, id, update)) };
}
export function removeBranch(node: TreeNode, id: string): TreeNode {
  return { ...node, children: node.children.filter(child => child.id !== id).map(child => removeBranch(child, id)) };
}
export function flattenTree(node: TreeNode): TreeNode[] { return [node, ...node.children.flatMap(flattenTree)]; }
export function expandTree(node: TreeNode, expanded: boolean): TreeNode { return { ...node, expanded, children: node.children.map(child => expandTree(child, expanded)) }; }
export function buildTree(label: string, opportunities: Opportunity[], features: Feature[], id: () => string): TreeNode {
  return { id: id(), label, type: "outcome", expanded: true, children: opportunities.map(opportunity => ({
    id: id(), label: opportunity.title, type: "opportunity", opportunityId: opportunity.id, expanded: true,
    children: features.filter(feature => feature.relatedOpportunityIds?.includes(opportunity.id)).map(feature => ({ id: id(), label: feature.title, type: "solution", featureId: feature.id, expanded: true, children: [] })),
  })) };
}
