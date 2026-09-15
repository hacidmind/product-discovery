"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Spinner, ToastProvider, Modal } from "@/components/ui";
import { LayoutDashboard, Search, Upload, Target, Users, Mic, ListChecks, FlaskConical, ShieldQuestion, Globe2, GitBranch, Moon, Sun, PanelLeftClose, PanelLeftOpen, Command, Sparkles, LogOut } from "@/components/icons";
import { fetchSession, signOut as signOutRequest, type SessionUser } from "@/lib/auth";
import { WorkspaceMotion, MotionLibraries } from "@/components/workspace-motion";
import { WorkspaceContext } from "@/components/workspace-context";
import type { Product } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/library", label: "Your research", icon: Globe2, shortcut: "L", group: "Workspace" },
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, shortcut: "1", group: "Workspace" },
  { href: "/research", label: "Research reports", icon: Globe2, shortcut: "0", group: "Understand" },
  { href: "/discover", label: "Customer insights", icon: Target, shortcut: "2", group: "Understand" },
  { href: "/interviews", label: "Interviews", icon: Mic, shortcut: "6", group: "Understand" },
  { href: "/import", label: "Import evidence", icon: Upload, shortcut: "3", group: "Understand" },
  { href: "/personas", label: "Personas", icon: Users, shortcut: "5", group: "Understand" },
  { href: "/opportunities", label: "Opportunities", icon: Target, shortcut: "4", group: "Decide" },
  { href: "/features", label: "Feature priorities", icon: ListChecks, shortcut: "7", group: "Decide" },
  { href: "/assumptions", label: "Assumptions", icon: ShieldQuestion, shortcut: "9", group: "Validate" },
  { href: "/experiments", label: "Experiments", icon: FlaskConical, shortcut: "8", group: "Validate" },
  { href: "/tree", label: "Solution Tree", icon: GitBranch, shortcut: "T", group: "Validate" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [light, setLight] = useState(false); const [sidebarOpen, setSidebarOpen] = useState(true); const [product, setProduct] = useState(""); const [draftProduct, setDraftProduct] = useState(""); const [products, setProducts] = useState<Product[]>([]); const [chooseProduct, setChooseProduct] = useState(false); const [ready, setReady] = useState(false); const [mounted, setMounted] = useState(false); const [session, setSessionUser] = useState<SessionUser | null>(null);
  const [workspaceError, setWorkspaceError] = useState("");
  const [saving, setSaving] = useState(false);
  const productName = products.find(item => item.id === product)?.name || "";
  const productRef = useRef(product);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true); const isLight = localStorage.getItem("theme") === "light"; setLight(isLight); document.documentElement.classList.toggle("light", isLight); if (window.matchMedia("(max-width: 767px)").matches) setSidebarOpen(false);
    Promise.all([fetchSession(), fetch("/api/products", { cache: "no-store" }).then(async response => { if (response.ok) return response.json() as Promise<Product[]>; const data = await response.json().catch(() => null); throw new Error(typeof data?.error === "string" ? data.error : "Unable to load workspaces"); })]).then(([user, ownedProducts]) => {
      if (user) setSessionUser(user);
      setProducts(ownedProducts);
      const savedProduct = localStorage.getItem("active-product") || "";
      const activeProduct = ownedProducts.find(item => item.id === savedProduct);
      if (activeProduct) { productRef.current = activeProduct.id; setProduct(activeProduct.id); }
      else if (window.location.pathname !== "/library") router.replace("/library");
      setReady(true);
    }).catch((error) => { setWorkspaceError(error instanceof Error ? error.message : "We could not load your workspaces. Check your connection and reload to try again."); setReady(true); });
  }, [router]);
  useEffect(() => { productRef.current = product; }, [product]);
  useEffect(() => { const originalFetch = window.fetch.bind(window); window.fetch = (input, init = {}) => { const request = input instanceof Request ? input : undefined; const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url; if (!url.startsWith("/api/") || url === "/api/products") return originalFetch(input, init); const headers = new Headers(init.headers ?? request?.headers); const context = productRef.current; if (context) headers.set("x-product-context", context); return originalFetch(input, { ...init, headers }); }; return () => { window.fetch = originalFetch; }; }, []);
  const selectProduct = (selected: Product, destination = "/dashboard") => {
    localStorage.setItem("active-product", selected.id);
    productRef.current = selected.id;
    setProduct(selected.id);
    setChooseProduct(false);
    setWorkspaceError("");
    window.dispatchEvent(new CustomEvent("active-product-changed", { detail: { productId: selected.id } }));
    router.push(destination);
  };
  const saveProduct = async () => {
    const name = draftProduct.trim();
    if (!name || saving) return;
    setSaving(true); setWorkspaceError("");
    try {
      const response = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create the workspace.");
      const created = data as Product;
      setProducts(previous => previous.some(item => item.id === created.id) ? previous : [...previous, created]);
      selectProduct(created, "/research?new=1"); setDraftProduct("");
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Could not create the workspace. Please try again.");
    } finally { setSaving(false); }
  };
  const handleSignOut = async () => {
    try { await signOutRequest(); localStorage.removeItem("active-product"); router.replace("/login"); }
    catch { setWorkspaceError("Sign out failed. Please check your connection and try again."); }
  };
  const initials = session ? session.name.trim().split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase() : "";
  const toggleTheme = useCallback(() => setLight(prev => { const next = !prev; document.documentElement.classList.toggle("light", next); localStorage.setItem("theme", next ? "light" : "dark"); return next; }), []);
  useEffect(() => { const handler = (e: KeyboardEvent) => { if (document.querySelector('[role="dialog"], [role="alertdialog"]') || chooseProduct || e.altKey || (e.target instanceof HTMLElement && e.target.isContentEditable)) return; if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return; if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); router.push("/search"); return; } if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { e.preventDefault(); setSidebarOpen(prev => !prev); return; } if (e.metaKey || e.ctrlKey || e.shiftKey) return; const item = NAV_ITEMS.find(x => x.shortcut.toLowerCase() === e.key.toLowerCase()); if (item) router.push(item.href); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [router, chooseProduct]);
  const visibleNav = NAV_ITEMS.filter(item => product || item.href === "/library");
  const page = NAV_ITEMS.find(item => item.href === pathname)?.label ?? (pathname === "/search" ? "Search" : "Workspace");
  return <WorkspaceContext.Provider value={{ openWorkspace: selectProduct, createWorkspace: () => { setDraftProduct(""); setChooseProduct(true); } }}><ToastProvider><MotionLibraries /><a href="#main-content" className="skip-link">Skip to content</a><div className="flex min-h-screen overflow-hidden bg-[var(--bg)]">
    <aside id="workspace-navigation" inert={!sidebarOpen} className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)] transition-transform duration-300 md:static ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:hidden"}`} aria-label="Main navigation">
      <div className="flex h-[72px] items-center gap-3 border-b border-[var(--border)] px-5"><div className="grid size-9 place-items-center rounded-xl bg-[var(--accent)] text-[var(--bg)]"><Sparkles size={18} /></div><div><p className="font-display text-sm font-bold tracking-tight">Product Discovery</p><button onClick={() => { setWorkspaceError(""); setChooseProduct(true); }} className="block max-w-40 truncate text-left text-[10px] uppercase tracking-[.15em] text-[var(--accent)] hover:underline">{productName || "Choose research"}</button></div></div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">{visibleNav.map((item, index) => { const Icon = item.icon; const active = pathname === item.href || pathname.startsWith(item.href + "/"); return <div key={item.href}>{(index === 0 || visibleNav[index - 1].group !== item.group) && <p className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[.15em] text-[var(--text-secondary)]">{item.group}</p>}<Link href={item.href} aria-current={active ? "page" : undefined} onClick={() => { if (window.matchMedia("(max-width: 767px)").matches) setSidebarOpen(false); }} className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-[var(--accent-light)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"}`}><Icon size={17} strokeWidth={active ? 2.25 : 1.8} /><span className="flex-1">{item.label}</span><kbd className="hidden font-mono text-[10px] text-[var(--text-tertiary)] lg:block">{item.shortcut}</kbd></Link></div>; })}</nav>
      <div className="border-t border-[var(--border)] p-3">{session && <div className="mb-2 flex items-center gap-2.5 border-b border-[var(--border)] pb-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--accent-light)] text-xs font-semibold text-[var(--accent)]">{initials}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-[var(--text)]">{session.name}</p><p className="truncate text-[10px] text-[var(--text-tertiary)]">{session.email}</p></div><button onClick={handleSignOut} aria-label="Sign out" title="Sign out" className="rounded-md p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--danger)]"><LogOut size={15} /></button></div>}<Link href="/search" className="mb-2 flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"><Search size={14} /><span className="flex-1">Search anything</span><Command size={12} /><span>K</span></Link><button onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">{light ? <Moon size={17} /> : <Sun size={17} />}<span>{light ? "Dark mode" : "Light mode"}</span></button></div>
    </aside>
    {sidebarOpen && <button aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/45 md:hidden" />}
    <div className="flex min-w-0 flex-1 flex-col"><header className="flex h-[72px] items-center gap-3 border-b border-[var(--border)] bg-[var(--bg)] px-4 md:px-7"><button onClick={() => setSidebarOpen(prev => !prev)} className="grid size-9 place-items-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]" aria-label="Toggle navigation" aria-expanded={sidebarOpen} aria-controls="workspace-navigation">{sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}</button><div className="flex min-w-0 items-center gap-2.5"><div className="min-w-0"><p className="font-display text-base font-semibold">{page}</p><p className="max-w-[45vw] truncate text-[11px] text-[var(--text-tertiary)]">{product ? `Research: ${productName}` : "Choose a research workspace to begin"}</p></div>{product && <button onClick={() => { setWorkspaceError(""); setChooseProduct(true); }} title="Switch research without mixing its records" className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">Switch research</button>}</div><Link href="/search" className="ml-auto hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-tertiary)] sm:flex"><Search size={14} />Search <kbd className="ml-5 font-mono">Ctrl K</kbd></Link></header><main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-4 md:p-7">{workspaceError && !chooseProduct && <div role="alert" className="mb-4 rounded-xl border border-[var(--danger)] p-4 text-sm">{workspaceError} <button className="ml-2 underline" onClick={() => window.location.reload()}>Reload</button></div>}{ready ? (product || pathname === "/library" ? <WorkspaceMotion key={product + pathname}>{children}</WorkspaceMotion> : <div className="mx-auto max-w-lg py-16 text-center"><h1 className="font-display text-2xl font-semibold">Your next discovery starts here</h1><p className="my-4 text-sm text-[var(--text-secondary)]">Choose a workspace to keep your research, evidence, and experiments together.</p><button className="rounded-lg bg-[var(--accent)] px-4 py-3 text-[var(--bg)]" onClick={() => router.push("/library")}>View your research</button></div>) : <div className="flex h-full min-h-[40vh] items-center justify-center"><Spinner size={24} /></div>}</main></div>
    <Modal open={mounted && ready && chooseProduct} onClose={() => { if (!saving) setChooseProduct(false); }} title={products.length ? "Switch research" : "Create your first research"}>
      <p className="text-sm leading-6 text-[var(--text-secondary)]">Each research workspace has its own insights, reports, opportunities, features, experiments, and Solution Tree. Switching will not move or merge records.</p>
      {products.length > 0 && <div className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">{products.map(item => <button disabled={saving} key={item.id} onClick={() => selectProduct(item)} aria-current={item.id === product ? "true" : undefined} className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg-hover)] ${item.id === product ? "border-[var(--accent)] bg-[var(--accent-light)]" : "border-[var(--border)]"}`}><span className="min-w-0"><span className="block truncate text-sm font-medium">{item.name}</span><span className="mt-1 block text-xs text-[var(--text-secondary)]">{item.researchCount || 0} saved reports</span></span><span className="text-xs text-[var(--accent)]">{item.id === product ? "Current" : "Open →"}</span></button>)}</div>}
      <form className="mt-6 border-t border-[var(--border)] pt-5" onSubmit={event => { event.preventDefault(); void saveProduct(); }}>
        <label htmlFor="workspace-name" className="block text-sm font-medium">New research name</label>
        <input id="workspace-name" required maxLength={100} disabled={saving} value={draftProduct} onChange={event => setDraftProduct(event.target.value)} placeholder="e.g. Card issuance and tokenisation" className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-sm" />
        {workspaceError && <p role="alert" className="mt-3 text-sm text-[var(--danger)]">{workspaceError}</p>}
        <button type="submit" disabled={saving || !draftProduct.trim()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--bg)] disabled:opacity-50">{saving && <Spinner />}{saving ? "Creating research..." : "Create new research"}</button>
      </form>
    </Modal>
  </div></ToastProvider></WorkspaceContext.Provider>;
}
