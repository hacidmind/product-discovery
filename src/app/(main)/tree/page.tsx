"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Card, Modal, Spinner } from "@/components/ui";
import type { TreeNode, Opportunity, Experiment } from "@/lib/types";

export default function SolutionTreePage() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [addType, setAddType] = useState<"outcome" | "opportunity" | "solution" | "experiment">("opportunity");
  const [parentId, setParentId] = useState<string | null>(null);
  const [showParentSelect, setShowParentSelect] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const loaded = useRef(false);
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      async function load() {
        try {
          const treeRes = await fetch("/api/tree");
          if (treeRes.ok) {
            const saved = await treeRes.json();
            if (saved && saved.id) setTree(saved);
          }
        } catch { /* no saved tree */ }

        const [opps, exps] = await Promise.all([
          fetch("/api/opportunities").then((r) => r.json()),
          fetch("/api/experiments").then((r) => r.json()),
        ]);
        setOpportunities(Array.isArray(opps) ? opps : []);
        setExperiments(Array.isArray(exps) ? exps : []);
        setLoading(false);
      }
      load();
    }
  }, []);

  const saveTree = async (t: TreeNode) => {
    await fetch("/api/tree", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t),
    });
  };

  // Auto-build tree from data if none exists
  const autoBuild = useCallback(() => {
    const root: TreeNode = {
      id: "root",
      label: "Desired Outcome",
      type: "outcome",
      children: [],
      expanded: true,
    };

    // Map opportunities as second level
    for (const opp of opportunities) {
      const oppNode: TreeNode = {
        id: `opp-${opp.id}`,
        label: opp.title,
        type: "opportunity",
        children: [],
        opportunityId: opp.id,
        expanded: false,
      };

      // Map experiments under opportunities
      const relatedExps = experiments.filter((e) =>
        e.relatedAssumptionIds.length > 0
      );
      if (relatedExps.length > 0) {
        for (const exp of relatedExps.slice(0, 2)) {
          oppNode.children.push({
            id: `exp-${exp.id}`,
            label: exp.title,
            type: "experiment",
            children: [],
            experimentId: exp.id,
            expanded: false,
          });
        }
      }

      root.children.push(oppNode);
    }

    // If no opportunities, add placeholder
    if (root.children.length === 0) {
      root.children.push({
        id: "placeholder1",
        label: "Discover opportunities first",
        type: "opportunity",
        children: [],
        expanded: false,
      });
    }

    setTree(root);
    saveTree(root);
  }, [opportunities, experiments]);

  const toggleExpand = (nodeId: string) => {
    if (!tree) return;
    const newTree = toggleNode(tree, nodeId);
    setTree({ ...newTree });
  };

  const toggleNode = (node: TreeNode, targetId: string): TreeNode => {
    if (node.id === targetId) return { ...node, expanded: !node.expanded };
    return {
      ...node,
      children: node.children.map((c) => toggleNode(c, targetId)),
    };
  };

  const addChild = () => {
    if (!tree || !newLabel.trim() || !parentId) return;

    const newNode: TreeNode = {
      // eslint-disable-next-line react-hooks/purity
      id: `node-${Date.now()}`,
      label: newLabel,
      type: addType,
      children: [],
      expanded: true,
    };

    const updated = addNodeToParent(tree, parentId, newNode);
    setTree(updated);
    saveTree(updated);
    setNewLabel("");
    setShowAdd(false);
    setShowParentSelect(false);
    setParentId(null);
  };

  const addNodeToParent = (node: TreeNode, targetId: string, newNode: TreeNode): TreeNode => {
    if (node.id === targetId) {
      return { ...node, children: [...node.children, newNode], expanded: true };
    }
    return {
      ...node,
      children: node.children.map((c) => addNodeToParent(c, targetId, newNode)),
    };
  };

  // SVG Tree Renderer
  // --- Uses simple recursion, no Three.js needed for this kind of visualization

  const renderTree = () => {
    if (!tree) return null;

    const nodePositions: Map<string, { x: number; y: number; node: TreeNode }> = new Map();
    let rightmost = 0;

    function layout(node: TreeNode, x: number, y: number, depth: number): number {
      const positions = node.expanded ? node.children : [];
      if (positions.length === 0) {
        nodePositions.set(node.id, { x, y, node });
        return x + 180;
      }

      let childX = x;
      for (const child of positions) {
        childX = layout(child, childX, y + 80, depth + 1);
      }

      const midX = (x + childX - 180) / 2;
      nodePositions.set(node.id, { x: midX, y, node });
      rightmost = Math.max(rightmost, childX);
      return childX;
    }

    layout(tree, 40, 40, 0);

    const width = rightmost + 40;
    const maxY = Math.max(...Array.from(nodePositions.values()).map((p) => p.y)) + 60;

    // Build edges and nodes
    const edges: { from: { x: number; y: number }; to: { x: number; y: number } }[] = [];
    const nodes: { id: string; x: number; y: number; node: TreeNode }[] = [];

    function collect(node: TreeNode) {
      const pos = nodePositions.get(node.id);
      if (!pos) return;
      nodes.push({ id: node.id, x: pos.x, y: pos.y, node });

      if (node.expanded) {
        for (const child of node.children) {
          const childPos = nodePositions.get(child.id);
          if (childPos) {
            edges.push({
              from: { x: pos.x + 75, y: pos.y + 36 },
              to: { x: childPos.x + 20, y: childPos.y },
            });
          }
          collect(child);
        }
      }
    }

    collect(tree);

    const colors: Record<string, string> = {
      outcome: "#3b82f6",
      opportunity: "#f59e0b",
      solution: "#22c55e",
      experiment: "#8b5cf6",
    };

    return (
      <svg
        viewBox={`0 0 ${width} ${maxY}`}
        className="h-auto min-h-[400px] min-w-[720px] w-full"
        style={{ fontFamily: "var(--font-geist-sans)" }}
      >
        {/* Edges */}
        {edges.map((edge, i) => (
          <line
            key={i}
            x1={edge.from.x}
            y1={edge.from.y}
            x2={edge.to.x}
            y2={edge.to.y}
            stroke="var(--border)"
            strokeWidth="1.5"
          />
        ))}

        {/* Nodes */}
        {nodes.map(({ id, x, y, node }) => {
          const color = colors[node.type] || "#6b7280";
          return (
            <g key={id} className="cursor-pointer" onClick={() => toggleExpand(id)}>
              {/* Background */}
              <rect
                x={x - 4}
                y={y - 4}
                width="158"
                height="40"
                rx="8"
                fill="var(--bg)"
                stroke={color}
                strokeWidth="1.5"
                className="transition-colors hover:opacity-90"
              />
              <text
                x={x + 8}
                y={y + 16}
                fontSize="11"
                fill="var(--text)"
                fontFamily="inherit"
                fontWeight="500"
                textAnchor="start"
              >
                {node.label.length > 22 ? node.label.slice(0, 22) + "..." : node.label}
              </text>
              <text
                x={x + 8}
                y={y + 30}
                fontSize="9"
                fill={color}
                fontFamily="inherit"
              >
                {node.type}
                {node.children.length > 0 ? ` (${node.children.length})` : ""}
              </text>
              {/* Expand indicator */}
              {node.children.length > 0 && (
                <text
                  x={x + 142}
                  y={y + 24}
                  fontSize="10"
                  fill="var(--text-secondary)"
                  fontFamily="inherit"
                >
                  {node.expanded ? "−" : "+"}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  const getAllNodes = (node: TreeNode): { id: string; label: string }[] => {
    const result = [{ id: node.id, label: node.label }];
    for (const child of node.children) {
      result.push(...getAllNodes(child));
    }
    return result;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size={24} />
      </div>
    );
  }

  return (
    <div className="max-w-full animate-fadein">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Opportunity Solution Tree</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Visualize your outcome, opportunities, and experiments. Click nodes to expand/collapse.
          </p>
        </div>
        <div className="flex gap-2">
          {opportunities.length > 0 && !tree && (
            <Button variant="secondary" onClick={autoBuild}>
              Auto-build from Data
            </Button>
          )}
          {tree && (
            <Button
              variant="secondary"
              onClick={() => {
                setShowParentSelect(true);
                setShowAdd(true);
              }}
            >
              + Add Node
            </Button>
          )}
          {!tree && (
            <Button
              onClick={() => {
                setTree({
                  id: "root",
                  label: "Desired Outcome",
                  type: "outcome",
                  children: [],
                  expanded: true,
                });
              }}
            >
              Create Tree
            </Button>
          )}
        </div>
      </div>

      {!tree ? (
        <Card className="p-8 text-center">
          <div className="text-3xl mb-3">🌳</div>
          <h2 className="text-sm font-semibold mb-1">No solution tree yet</h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            Create a tree manually or auto-build from your existing opportunities and experiments.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-4">
          <div
            className="max-h-[65vh] overflow-auto overscroll-contain cursor-grab touch-pan-x touch-pan-y active:cursor-grabbing"
            onMouseDown={(e) => {
              setDragging(true);
              dragStart.current = { x: e.clientX, y: e.clientY, panX, panY };
            }}
            onMouseMove={(e) => {
              if (!dragging) return;
              const dx = e.clientX - dragStart.current.x;
              const dy = e.clientY - dragStart.current.y;
              setPanX(dragStart.current.panX + dx);
              setPanY(dragStart.current.panY + dy);
            }}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
          >
            <div className="min-w-[720px]" style={{ transform: `translate(${panX}px, ${panY}px)` }}>
              {renderTree()}
            </div>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-3 text-center">
            Click on nodes to expand/collapse · Drag to pan
          </p>
        </Card>
      )}

      {/* Add Node Modal */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setShowParentSelect(false); setParentId(null); }}
        title={showParentSelect ? "Add Node" : "New Node"}
      >
        <div className="space-y-4">
          {showParentSelect && tree && (
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Parent Node</label>
              <select
                value={parentId || ""}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                  text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="">Select parent...</option>
                {getAllNodes(tree).map((n) => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Type</label>
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value as typeof addType)}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="outcome">Outcome</option>
              <option value="opportunity">Opportunity</option>
              <option value="solution">Solution</option>
              <option value="experiment">Experiment</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">Label</label>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Reduce onboarding time"
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm
                text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setShowAdd(false); setShowParentSelect(false); }}>
              Cancel
            </Button>
            <Button onClick={addChild} disabled={!newLabel.trim() || (showParentSelect && !parentId)}>
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}