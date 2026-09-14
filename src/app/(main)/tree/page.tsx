"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Modal, Spinner, ConfirmDialog } from "@/components/ui";
import { ModuleError } from "@/components/module-feedback";
import { checkedFetch } from "@/lib/api-client";
import { buildTree, expandTree, flattenTree, mapTree, removeBranch } from "@/lib/solution-tree";
import type { TreeNode, Opportunity, Feature, Experiment } from "@/lib/types";

const guide = {
  outcome: { label: "Outcome", question: "What measurable change do you want to achieve?", example: "Increase activation from 25% to 40%", color: "var(--data)" },
  opportunity: { label: "Opportunity", question: "What customer problem or unmet need stands in the way?", example: "New customers struggle to complete setup", color: "var(--accent)" },
  solution: { label: "Solution", question: "What could you build or change to address this need?", example: "A guided setup checklist", color: "var(--success)" },
  experiment: { label: "Experiment", question: "How will you test this idea before committing?", example: "Test a prototype with five new customers", color: "#a78bfa" },
};

function TreeBranch({ node, selectedId, select, toggle, busy }: { node: TreeNode; selectedId: string; select: (node: TreeNode) => void; toggle: (id: string) => void; busy: boolean }) {
  return <li className="solution-branch">
    <div className={`solution-node ${selectedId === node.id ? "solution-node-selected" : ""}`} style={{ borderLeftColor: guide[node.type].color }}>
      <button disabled={busy} onClick={() => select(node)} aria-pressed={selectedId === node.id} className="min-w-0 flex-1 p-4 text-left">
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider" style={{ color: guide[node.type].color }}>{guide[node.type].label}</span>
        <span className="block break-words text-sm font-medium leading-6">{node.label}</span>
        {(node.opportunityId || node.featureId || node.experimentId) && <span className="mt-2 block text-[10px] text-[var(--text-secondary)]">Linked to a workspace record</span>}
      </button>
      {node.children.length > 0 && <button disabled={busy} className="m-2 self-start rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs" aria-label={`${node.expanded ? "Collapse" : "Expand"} ${node.label}`} aria-expanded={node.expanded} onClick={() => toggle(node.id)}>{node.expanded ? "-" : "+"} {node.children.length}</button>}
    </div>
    {node.expanded && node.children.length > 0 && <ul className="solution-children">{node.children.map(child => <TreeBranch key={child.id} node={child} selectedId={selectedId} select={select} toggle={toggle} busy={busy} />)}</ul>}
  </li>;
}

export default function SolutionTreePage() {
  const editorRef = useRef<HTMLElement>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [outcome, setOutcome] = useState("");
  const [includeExisting, setIncludeExisting] = useState(true);
  const [addType, setAddType] = useState<TreeNode["type"] | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [linkedId, setLinkedId] = useState("");
  const [deleting, setDeleting] = useState(false);
  const selected = tree ? flattenTree(tree).find(node => node.id === selectedId) : undefined;
  const load = useCallback(async () => {
    try {
      const [savedTree, opps, feats, exps] = await Promise.all(["tree", "opportunities", "features", "experiments"].map(async name => (await checkedFetch(`/api/${name}`)).json()));
      setError(""); setTree(savedTree); setOpportunities(opps); setFeatures(feats); setExperiments(exps);
      setSelectedId(savedTree?.id || ""); setEditLabel(savedTree?.label || ""); setSaved(false);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not load your tree."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);
  const commit = async (next: TreeNode) => {
    if (saving) return false;
    setSaving(true); setError(""); setSaved(false);
    try {
      const response = await checkedFetch("/api/tree", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
      const result = await response.json() as TreeNode;
      setTree(result); setSaved(true); return true;
    } catch (error) { setError(error instanceof Error ? error.message : "Your changes could not be saved. Please try again."); return false; }
    finally { setSaving(false); }
  };
  const select = (node: TreeNode) => { setSelectedId(node.id); setEditLabel(node.label); if (window.matchMedia("(max-width: 1023px)").matches) requestAnimationFrame(() => editorRef.current?.scrollIntoView({ block: "start", behavior: "instant" })); };
  const start = async () => {
    if (!outcome.trim()) return;
    const next = buildTree(outcome.trim(), includeExisting ? opportunities : [], features, () => crypto.randomUUID());
    if (await commit(next)) select(next);
  };
  const openAdd = (type: TreeNode["type"]) => { setAddType(type); setNewLabel(""); setLinkedId(""); };
  const add = async () => {
    if (!tree || !selected || !addType || !newLabel.trim()) return;
    const node: TreeNode = { id: crypto.randomUUID(), label: newLabel.trim(), type: addType, children: [], expanded: true };
    if (linkedId) {
      if (addType === "opportunity") node.opportunityId = linkedId;
      if (addType === "solution") node.featureId = linkedId;
      if (addType === "experiment") node.experimentId = linkedId;
    }
    if (await commit(mapTree(tree, selected.id, parent => ({ ...parent, expanded: true, children: [...parent.children, node] })))) { setAddType(null); select(node); }
  };
  const options = addType === "opportunity" ? opportunities : addType === "solution" ? features : experiments;
  const linkedHref = selected?.opportunityId ? "/opportunities" : selected?.featureId ? "/features" : selected?.experimentId ? "/experiments" : null;
  return <div className="mx-auto max-w-6xl">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Connect evidence to decisions</p><h1 className="font-display text-2xl font-semibold">Solution Tree</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Start with an outcome. Explore customer needs, possible solutions, and ways to test them.</p></div><span role="status" className="text-xs text-[var(--text-secondary)]">{saving ? "Saving changes..." : saved ? "Changes saved" : ""}</span></div>
    <ol className="mb-6 grid grid-cols-2 gap-2 lg:grid-cols-4">{Object.entries(guide).map(([type, item], i) => <li key={type} className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3"><p className="text-xs font-semibold" style={{ color: item.color }}>{i + 1}. {item.label}</p><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{item.question}</p></li>)}</ol>
    <ModuleError message={error} retry={() => { setLoading(true); setError(""); void load(); }} />
    {loading ? <div className="grid min-h-48 place-items-center"><Spinner size={24} /></div> : !tree ? (!error || !!outcome) && <section className="discovery-guide rounded-2xl border border-[var(--border)] p-6 sm:p-9"><h2 className="text-xl font-semibold">What outcome are you working towards?</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Be specific about who benefits and how you will measure progress.</p><form className="mt-6 max-w-xl space-y-4" onSubmit={event => { event.preventDefault(); void start(); }}><label className="block text-sm font-medium">Desired outcome<input required maxLength={200} value={outcome} onChange={event => setOutcome(event.target.value)} placeholder={guide.outcome.example} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm" /></label>{opportunities.length > 0 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeExisting} onChange={event => setIncludeExisting(event.target.checked)} />Include my {opportunities.length} opportunities and their linked features</label>}<Button type="submit" size="md" disabled={saving || !outcome.trim()}>Create Solution Tree</Button></form></section> : <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section aria-label="Your Solution Tree" className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3 sm:p-5"><div className="mb-4 flex flex-wrap items-center gap-2"><Button variant="ghost" disabled={saving} onClick={() => setTree(expandTree(tree, true))}>Expand all</Button><Button variant="ghost" disabled={saving} onClick={() => setTree({ ...expandTree(tree, false), expanded: true })}>Collapse branches</Button><span className="ml-auto text-xs text-[var(--text-secondary)]">{flattenTree(tree).length} items</span></div><ul className="solution-root"><TreeBranch node={tree} selectedId={selectedId} select={select} busy={saving} toggle={id => setTree(mapTree(tree, id, node => ({ ...node, expanded: !node.expanded })))} /></ul></section>
      <aside ref={editorRef} aria-label="Edit selected item" className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 lg:sticky lg:top-5">{selected ? <><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: guide[selected.type].color }}>{guide[selected.type].label}</p><p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{guide[selected.type].question}</p><form onSubmit={async event => { event.preventDefault(); await commit(mapTree(tree, selected.id, node => ({ ...node, label: editLabel.trim() }))); }}><label className="mt-4 block text-xs font-medium">Title<textarea aria-label="Title" rows={4} maxLength={200} required value={editLabel} onChange={event => setEditLabel(event.target.value)} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm" /></label><Button type="submit" disabled={saving || !editLabel.trim() || editLabel.trim() === selected.label}>Save title</Button></form><div className="mt-5 flex flex-col items-start gap-2 border-t border-[var(--border)] pt-4">{selected.type === "outcome" && <Button disabled={saving} onClick={() => openAdd("opportunity")}>+ Add opportunity</Button>}{selected.type === "opportunity" && <><Button disabled={saving} onClick={() => openAdd("solution")}>+ Add solution</Button><Button variant="ghost" disabled={saving} onClick={() => openAdd("opportunity")}>+ Add sub-opportunity</Button></>}{selected.type === "solution" && <Button disabled={saving} onClick={() => openAdd("experiment")}>+ Add experiment</Button>}{selected.type === "experiment" && <p className="text-xs leading-5 text-[var(--text-secondary)]">Use the Experiments module to record your hypothesis, success criteria, and results.</p>}{linkedHref && <Link href={linkedHref} className="py-2 text-sm text-[var(--accent)] underline">View linked records</Link>}{selected.id !== tree.id && <Button variant="ghost" disabled={saving} onClick={() => setDeleting(true)}>Remove branch</Button>}</div></> : <p className="text-sm text-[var(--text-secondary)]">Select an item to edit it or add the next step.</p>}</aside>
    </div>}
    <Modal open={!!addType} onClose={() => { if (!saving) setAddType(null); }} title={`Add ${addType || "item"}`}><form onSubmit={event => { event.preventDefault(); void add(); }} className="space-y-4"><ModuleError message={error} /><p className="text-sm text-[var(--text-secondary)]">Under: {selected?.label}</p>{options.length > 0 && <label className="block text-sm">Link an existing record (optional)<select value={linkedId} onChange={event => { setLinkedId(event.target.value); const record = options.find(item => item.id === event.target.value); if (record) setNewLabel(record.title); }} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3"><option value="">Write a new tree item</option>{options.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>}<label className="block text-sm">Title<input required maxLength={200} value={newLabel} onChange={event => setNewLabel(event.target.value)} placeholder={addType ? guide[addType].example : ""} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3" /></label><p className="text-xs leading-5 text-[var(--text-secondary)]">New items are saved in this tree. Link an existing record when you want to connect it to your workspace evidence.</p><Button type="submit" disabled={saving || !newLabel.trim()}>Add to tree</Button></form></Modal>
    <ConfirmDialog open={deleting} onClose={() => setDeleting(false)} title="Remove this branch?" message={error || `This removes "${selected?.label}" and its children from the tree. Linked workspace records are kept.`} confirmLabel="Remove branch" onConfirm={async () => { if (!tree || !selected || saving) return; if (await commit(removeBranch(tree, selected.id))) { select(tree); setDeleting(false); } }} />
  </div>;
}
