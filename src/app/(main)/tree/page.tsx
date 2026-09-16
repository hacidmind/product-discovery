"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Modal, Spinner, ConfirmDialog } from "@/components/ui";
import { Sparkles, GitBranch, ArrowUpRight } from "@/components/icons";
import { ModuleError } from "@/components/module-feedback";
import { checkedFetch } from "@/lib/api-client";
import { buildTree, expandTree, flattenTree, mapTree, removeBranch } from "@/lib/solution-tree";
import { getTreeSuggestions, suggestionToNode, type TreeContext, type TreeSuggestion } from "@/lib/tree-suggestions";
import type { TreeNode } from "@/lib/types";

const guide = {
  outcome: { label: "Outcome", question: "What measurable change do you want to achieve?", example: "Increase activation from 25% to 40%", color: "var(--data)" },
  opportunity: { label: "Opportunity", question: "What customer problem or unmet need stands in the way?", example: "New customers struggle to complete setup", color: "var(--accent)" },
  solution: { label: "Solution", question: "What could you build or change to address this need?", example: "A guided setup checklist", color: "var(--success)" },
  experiment: { label: "Experiment", question: "What assumption must be true, and how will you test it?", example: "Test a prototype with five new customers", color: "#a78bfa" },
};
const emptyContext: TreeContext = { insights: [], opportunities: [], features: [], experiments: [] };

function TreeBranch({ node, selectedId, select, toggle, busy }: { node: TreeNode; selectedId: string; select: (node: TreeNode) => void; toggle: (id: string) => void; busy: boolean }) {
  return <li className="solution-branch">
    <div className={`solution-node ${selectedId === node.id ? "solution-node-selected" : ""}`} data-node-id={node.id} style={{ borderLeftColor: guide[node.type].color }}>
      <button disabled={busy} onClick={() => select(node)} aria-pressed={selectedId === node.id} className="min-w-0 flex-1 p-4 text-left">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[.14em]" style={{ color: guide[node.type].color }}>{guide[node.type].label}</span>
        <span className="block break-words text-sm font-medium leading-6">{node.label}</span>
        {(node.opportunityId || node.featureId || node.experimentId || node.insightId) ? <span className="mt-3 block text-[10px] text-[var(--text-secondary)]">Linked workspace evidence</span> : node.guidance?.basis === "starter" ? <span className="mt-3 block text-[10px] text-[var(--text-secondary)]">Suggested idea · Needs validation</span> : null}
      </button>
      {node.children.length > 0 && <button disabled={busy} className="m-2 self-start rounded-lg border border-[var(--border)] px-2 py-1 text-xs" aria-label={`${node.expanded ? "Collapse" : "Expand"} ${node.label}`} aria-expanded={node.expanded} onClick={() => toggle(node.id)}>{node.expanded ? "−" : "+"} {node.children.length}</button>}
    </div>
    {node.expanded && node.children.length > 0 && <ul className="solution-children">{node.children.map(child => <TreeBranch key={child.id} node={child} selectedId={selectedId} select={select} toggle={toggle} busy={busy} />)}</ul>}
  </li>;
}

function SuggestionCards({ suggestions, choose, busy, starting = false }: { suggestions: TreeSuggestion[]; choose: (suggestion: TreeSuggestion) => void; busy: boolean; starting?: boolean }) {
  return <div className={starting ? "grid gap-3 md:grid-cols-3" : "space-y-3"}>
    {suggestions.slice(0, starting ? 3 : 4).map(suggestion => <article key={suggestion.key} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"><span className={`size-1.5 rounded-full ${suggestion.guidance.basis === "workspace" ? "bg-[var(--data)]" : "bg-[var(--accent)]"}`} />{suggestion.guidance.basis === "workspace" ? "From your workspace" : "Idea to validate"}</div>
      <h3 className="text-sm font-medium leading-6">{suggestion.label}</h3>
      <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{suggestion.guidance.rationale}</p>
      <Button variant="secondary" className="mt-3" disabled={busy} onClick={() => choose(suggestion)}>{starting ? "Use this outcome" : "Review suggestion"}<ArrowUpRight size={13} /></Button>
    </article>)}
  </div>;
}

function GuidanceDetails({ node }: { node: Pick<TreeNode, "guidance"> }) {
  if (!node.guidance) return null;
  return <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-xs leading-5">
    <p className="font-medium text-[var(--accent)]">{node.guidance.basis === "workspace" ? "Workspace context" : "Suggested approach · Validate before committing"}</p>
    <p className="text-[var(--text-secondary)]">{node.guidance.rationale}</p>
    {([['evidence', 'Source evidence'], ['assumption', 'Assumption to test'], ['testPlan', 'How to test'], ['successSignal', 'Decision criteria']] as const).map(([key, label]) => node.guidance?.[key] ? <div key={key}><p className="font-semibold">{label}</p><p className="mt-1 whitespace-pre-wrap text-[var(--text-secondary)]">{node.guidance[key]}</p></div> : null)}
  </div>;
}

export default function SolutionTreePage() {
  const editorRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const outcomeRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [context, setContext] = useState<TreeContext>(emptyContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [outcome, setOutcome] = useState("");
  const [includeExisting, setIncludeExisting] = useState(true);
  const [view, setView] = useState<"diagram" | "outline">("diagram");
  const [addType, setAddType] = useState<TreeNode["type"] | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [linkedId, setLinkedId] = useState("");
  const [pendingSuggestion, setPendingSuggestion] = useState<TreeSuggestion | null>(null);
  const [deleting, setDeleting] = useState(false);
  const selected = tree ? flattenTree(tree).find(node => node.id === selectedId) : undefined;
  const suggestions = getTreeSuggestions(selected || null, context);
  const { opportunities, features, experiments } = context;
  const load = useCallback(async () => {
    try {
      const [savedTree, opps, feats, exps, insights] = await Promise.all(["tree", "opportunities", "features", "experiments", "insights"].map(async name => (await checkedFetch(`/api/${name}`)).json()));
      setError(""); setTree(savedTree); setContext({ opportunities: opps, features: feats, experiments: exps, insights });
      setSelectedId(savedTree?.id || ""); setEditLabel(savedTree?.label || ""); setSaved(false);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not load your tree."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timer); }, [load]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const node = canvas?.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(selectedId)}"]`);
    if (!canvas || !node) return;
    const outer = canvas.getBoundingClientRect();
    const inner = node.getBoundingClientRect();
    canvas.scrollTo({ left: canvas.scrollLeft + inner.left - outer.left - (canvas.clientWidth - inner.width) / 2, top: canvas.scrollTop + inner.top - outer.top - 32, behavior: "instant" });
  }, [selectedId, view]);
  const commit = async (next: TreeNode) => {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true); setError(""); setSaved(false);
    try {
      const response = await checkedFetch("/api/tree", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
      setTree(await response.json() as TreeNode); setSaved(true); return true;
    } catch (error) { setError(error instanceof Error ? error.message : "Your changes could not be saved. Please try again."); return false; }
    finally { savingRef.current = false; setSaving(false); }
  };
  const select = (node: TreeNode) => {
    setSelectedId(node.id); setEditLabel(node.label);
    if (window.matchMedia("(max-width: 1023px)").matches) requestAnimationFrame(() => editorRef.current?.scrollIntoView({ block: "start", behavior: "instant" }));
  };
  const start = async () => {
    if (!outcome.trim()) return;
    const next = buildTree(outcome.trim(), includeExisting ? opportunities : [], features, () => crypto.randomUUID());
    if (await commit(next)) select(next);
  };
  const openAdd = (type: TreeNode["type"]) => { setAddType(type); setNewLabel(""); setLinkedId(""); setPendingSuggestion(null); };
  const reviewSuggestion = (suggestion: TreeSuggestion) => {
    setAddType(suggestion.type); setNewLabel(suggestion.label); setPendingSuggestion(suggestion);
    setLinkedId(suggestion.opportunityId || suggestion.featureId || suggestion.experimentId || "");
  };
  const add = async () => {
    if (!tree || !selected || !addType || !newLabel.trim()) return;
    const node: TreeNode = pendingSuggestion ? { ...suggestionToNode(pendingSuggestion, crypto.randomUUID()), label: newLabel.trim() } : { id: crypto.randomUUID(), label: newLabel.trim(), type: addType, children: [], expanded: true };
    if (linkedId) {
      if (addType === "opportunity") node.opportunityId = linkedId;
      if (addType === "solution") node.featureId = linkedId;
      if (addType === "experiment") node.experimentId = linkedId;
    }
    if (await commit(mapTree(tree, selected.id, parent => ({ ...parent, expanded: true, children: [...parent.children, node] })))) { setAddType(null); setPendingSuggestion(null); select(node); }
  };
  const options = addType === "opportunity" ? opportunities : addType === "solution" ? features : experiments;
  const linkedHref = selected?.opportunityId ? "/opportunities" : selected?.featureId ? "/features" : selected?.experimentId ? "/experiments" : selected?.insightId ? "/discover" : null;
  const nextStep = selected?.type === "outcome" ? "Find a customer opportunity" : selected?.type === "opportunity" ? "Explore more than one solution" : selected?.type === "solution" ? "Test the riskiest assumption" : "Decide what you need to learn";

  return <div className="mx-auto max-w-[1600px]">
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.15em] text-[var(--accent)]"><GitBranch size={15} />Map the possibilities</p><h1 className="font-display text-2xl font-semibold">Solution Tree</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">One outcome. Multiple paths. Connect customer needs to ideas you can test.</p></div>
      <span role="status" className="text-xs text-[var(--text-secondary)]">{saving ? "Saving changes..." : saved ? "Changes saved" : ""}</span>
    </header>
    <ol className="mb-6 grid grid-cols-2 gap-2 lg:grid-cols-4">{Object.entries(guide).map(([type, item], i) => <li key={type} className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3"><p className="text-xs font-semibold" style={{ color: item.color }}>{i + 1}. {item.label}</p><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{item.question}</p></li>)}</ol>
    <ModuleError message={error} retry={() => { setLoading(true); setError(""); void load(); }} />
    {loading ? <div className="grid min-h-48 place-items-center"><Spinner size={24} /></div> : !tree ? (!error || !!outcome) && <div className="space-y-5">
      <section className="discovery-guide rounded-2xl border border-[var(--border)] p-6 sm:p-9">
        <h2 className="text-xl font-semibold">Start with a change, not a feature</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">Choose a customer behavior you want to improve. Add a baseline, target, and date so every branch has a purpose.</p>
        <form className="mt-6 max-w-2xl space-y-4" onSubmit={event => { event.preventDefault(); void start(); }}>
          <label className="block text-sm font-medium">Desired outcome<input ref={outcomeRef} required maxLength={200} value={outcome} onChange={event => setOutcome(event.target.value)} placeholder={guide.outcome.example} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm" /></label>
          {outcome.includes("[") && <p className="text-xs text-[var(--text-secondary)]">Replace the brackets with your own measures, or keep them as a draft until you have a baseline.</p>}
          {opportunities.length > 0 && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeExisting} onChange={event => setIncludeExisting(event.target.checked)} />Include my {opportunities.length} opportunities and their linked features</label>}
          <Button type="submit" size="md" disabled={saving || !outcome.trim()}>Create Solution Tree</Button>
        </form>
      </section>
      <section aria-label="Outcome suggestions" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Sparkles size={17} className="text-[var(--accent)]" />Not sure where to start?</h2><p className="mb-4 mt-2 text-sm text-[var(--text-secondary)]">Choose a starting point, then make it yours. These are draft goals, not measured results.</p>
        <SuggestionCards starting suggestions={suggestions} busy={saving} choose={suggestion => { setOutcome(suggestion.label); outcomeRef.current?.focus(); }} />
      </section>
    </div> : <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-label="Your Solution Tree" className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] p-4">
          <div className="flex rounded-lg border border-[var(--border)] p-1" aria-label="Tree view">{(["diagram", "outline"] as const).map(mode => <button key={mode} aria-pressed={view === mode} onClick={() => setView(mode)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${view === mode ? "bg-[var(--accent-light)] text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}>{mode === "diagram" ? "Tree diagram" : "Outline"}</button>)}</div>
          <Button variant="ghost" disabled={saving} onClick={() => setTree(expandTree(tree, true))}>Expand all</Button><Button variant="ghost" disabled={saving} onClick={() => setTree({ ...expandTree(tree, false), expanded: true })}>Collapse branches</Button>
          <span className="ml-auto text-xs text-[var(--text-secondary)]">{flattenTree(tree).length} nodes</span>
        </div>
        <div ref={canvasRef} tabIndex={0} role="region" aria-label="Scrollable tree canvas" className={`solution-canvas ${view === "diagram" ? "solution-diagram" : "solution-outline"}`}>
          <ul className="solution-root"><TreeBranch node={tree} selectedId={selectedId} select={select} busy={saving} toggle={id => setTree(mapTree(tree, id, node => ({ ...node, expanded: !node.expanded })))} /></ul>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--text-secondary)]"><span>Select a node to see suggestions for its next step.</span><span>{view === "diagram" ? "Scroll to explore branches →" : "Connected outline view"}</span></div>
        {tree.children.length === 0 && <div className="border-t border-[var(--border)] bg-[var(--accent-light)] p-5 text-sm"><p className="font-semibold">Your outcome is ready. What stands in the customer’s way?</p><p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">Choose a suggested opportunity or add a customer need from your own research. Try exploring at least two possible solutions for each opportunity.</p></div>}
      </section>
      <aside ref={editorRef} aria-label="Edit selected item" className="min-w-0 space-y-4">
        {selected ? <>
          <section aria-label="Next step suggestions" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <div className="mb-3 flex items-center gap-2 text-[var(--accent)]"><Sparkles size={17} /><h2 className="text-sm font-semibold">{nextStep}</h2></div>
            <p className="mb-4 text-xs leading-5 text-[var(--text-secondary)]">{selected.type === "experiment" ? "Write down the assumption, the test, and your decision threshold before running it. Use the results to keep, change, or abandon the solution." : "Not sure what to do next? Review a suggestion below. Nothing is added until you choose it."}</p>
            {selected.type === "experiment" ? <><GuidanceDetails node={selected} /><Link href="/experiments" className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--accent)] underline">Plan experiments and record results <ArrowUpRight size={13} /></Link></> : <SuggestionCards suggestions={suggestions} choose={reviewSuggestion} busy={saving} />}
            <p className="mt-4 text-[11px] leading-5 text-[var(--text-tertiary)]">Suggestions use your workspace records and discovery prompts. Validate suggested ideas with customers.</p>
          </section>
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: guide[selected.type].color }}>{guide[selected.type].label}</p><p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{guide[selected.type].question}</p>
            <form onSubmit={async event => { event.preventDefault(); await commit(mapTree(tree, selected.id, node => ({ ...node, label: editLabel.trim() }))); }}>
              <label className="mt-4 block text-xs font-medium">Title<textarea aria-label="Title" rows={3} maxLength={200} required value={editLabel} onChange={event => setEditLabel(event.target.value)} className="my-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm" /></label><Button type="submit" disabled={saving || !editLabel.trim() || editLabel.trim() === selected.label}>Save title</Button>
            </form>
            <div className="mt-4 flex flex-col items-start gap-2 border-t border-[var(--border)] pt-4">
              {selected.type === "outcome" && <Button disabled={saving} onClick={() => openAdd("opportunity")}>+ Add opportunity</Button>}
              {selected.type === "opportunity" && <><Button disabled={saving} onClick={() => openAdd("solution")}>+ Add solution</Button><Button variant="ghost" disabled={saving} onClick={() => openAdd("opportunity")}>+ Add sub-opportunity</Button></>}
              {selected.type === "solution" && <Button disabled={saving} onClick={() => openAdd("experiment")}>+ Add experiment</Button>}
              {linkedHref && <Link href={linkedHref} className="py-2 text-sm text-[var(--accent)] underline">View linked records</Link>}
              {selected.id !== tree.id && <Button variant="ghost" disabled={saving} onClick={() => setDeleting(true)}>Remove branch</Button>}
            </div>
            {selected.type !== "experiment" && selected.guidance && <div className="mt-4"><GuidanceDetails node={selected} /></div>}
          </section>
        </> : <p className="text-sm text-[var(--text-secondary)]">Select a node to explore its next step.</p>}
      </aside>
    </div>}
    <Modal open={!!addType} onClose={() => { if (!saving) setAddType(null); }} title={`Add ${addType || "item"}`}>
      <form onSubmit={event => { event.preventDefault(); void add(); }} className="space-y-4">
        <ModuleError message={error} /><p className="text-sm text-[var(--text-secondary)]">Under: {selected?.label}</p>
        {pendingSuggestion && <GuidanceDetails node={pendingSuggestion} />}
        {!pendingSuggestion && options.length > 0 && <label className="block text-sm">Link an existing record (optional)<select value={linkedId} onChange={event => { setLinkedId(event.target.value); const record = options.find(item => item.id === event.target.value); if (record) setNewLabel(record.title); }} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3"><option value="">Write a new tree item</option>{options.map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>}
        <label className="block text-sm">Title<input required maxLength={200} value={newLabel} onChange={event => setNewLabel(event.target.value)} placeholder={addType ? guide[addType].example : ""} className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3" /></label>
        <p className="text-xs leading-5 text-[var(--text-secondary)]">This adds a node to your tree. Workspace records stay separate; suggestions linked to existing evidence retain that connection.</p><Button type="submit" disabled={saving || !newLabel.trim()}>Add to tree</Button>
      </form>
    </Modal>
    <ConfirmDialog open={deleting} onClose={() => setDeleting(false)} title="Remove this branch?" message={error || `This removes "${selected?.label}" and its children from the tree. Linked workspace records are kept.`} confirmLabel="Remove branch" onConfirm={async () => { if (!tree || !selected || saving) return; if (await commit(removeBranch(tree, selected.id))) { select(tree); setDeleting(false); } }} />
  </div>;
}
