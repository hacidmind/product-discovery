import React, { useState, useMemo } from "react";
import {
  LayoutDashboard, Search as SearchIcon, Upload, Target, Users, Mic,
  ListChecks, FlaskConical, ShieldQuestion, Globe, GitBranch, Moon, Sun,
  ChevronDown, Plus, TrendingUp, TrendingDown, ArrowUpRight, Filter,
  MessageSquareQuote, Sparkles, X, FileText, FileJson, FileType,
  ChevronRight, Boxes, Quote, CheckCircle2, Circle
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, Tooltip
} from "recharts";

/* ---------------------------------------------------------------------- */
/* TOKENS                                                                  */
/* ---------------------------------------------------------------------- */
const T = {
  bg: "#0E1116", bgElevated: "#161B22", bgOverlay: "#1D232C", bgHover: "#20272F",
  border: "#262D38", borderStrong: "#333C4A",
  textPrimary: "#EDEFF3", textSecondary: "#9AA4B2", textTertiary: "#5B6472",
  signal: "#E8A33D", signalDim: "#3A2E1A",
  data: "#35C4B5", dataDim: "#123330",
  success: "#3FBF7F", danger: "#EF5B5B", info: "#4FA8E8",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap');
.font-display{font-family:'Space Grotesk',sans-serif;}
.font-body{font-family:'Inter',sans-serif;}
.font-mono{font-family:'JetBrains Mono',monospace; font-variant-numeric: tabular-nums;}
input,textarea,select{font-family:'Inter',sans-serif;}
::placeholder{color:#5B6472;}
`;

/* ---------------------------------------------------------------------- */
/* MOCK DATA                                                               */
/* ---------------------------------------------------------------------- */
const USERS = [
  { id: "u1", name: "Hafeez A.", role: "PM · Interswitch", initials: "HA", color: T.signal },
  { id: "u2", name: "Amara O.", role: "PM · Wurka", initials: "AO", color: T.data },
];

const PRODUCTS = [
  {
    id: "vcm", ownerId: "u1", name: "Virtual Card Middleware", initials: "VC", color: T.signal,
    description: "B2B card lifecycle & issuance platform for banks and fintechs",
    trend: [4, 6, 5, 9, 8, 12, 14, 13, 17, 19, 18, 22],
    insights: [
      { title: "Bulk card revocation missing", source: "Customer Complaint", emotion: "Frustrated", text: "Ops team can't bulk-freeze cards during a fraud spike — every card is revoked one by one." },
      { title: "Sandbox parity request", source: "Sales Feedback", emotion: "Neutral", text: "Partner bank integration team asked for a sandbox that mirrors production card states." },
      { title: "Webhook retries invisible", source: "Interview Notes", emotion: "Frustrated", text: "Issuers can't tell whether a failed webhook was retried or dropped." },
    ],
    opportunities: [
      { title: "Delayed card issuance for partner banks", desc: "Issuance latency spikes during batch windows.", score: 82, status: "Building", axes: [8, 7, 9, 8, 7, 6] },
      { title: "No bulk virtual card revocation", desc: "Fraud response requires per-card manual action.", score: 74, status: "Validated", axes: [7, 8, 6, 7, 8, 7] },
      { title: "Webhook retry visibility for issuers", desc: "No dashboard for delivery status.", score: 61, status: "Exploring", axes: [6, 5, 7, 6, 5, 6] },
    ],
    personas: [
      { name: "Tunde Adeyemi", role: "Bank Integrations Lead", quote: "I need the sandbox to lie to me exactly like production does.", goals: "Ship integrations without surprises in prod", frustrations: "Sandbox drift from production behaviour" },
      { name: "Chiamaka Obi", role: "Fraud Ops Analyst", quote: "By the time I've frozen 40 cards, the fraud has moved on.", goals: "Contain fraud incidents in minutes, not hours", frustrations: "No bulk actions on card status" },
    ],
    interviews: [
      { title: "Fraud ops workflow walkthrough", interviewee: "Chiamaka Obi", date: "2026-07-14", tags: ["fraud", "ops"] },
      { title: "Partner bank onboarding retro", interviewee: "Tunde Adeyemi", date: "2026-06-30", tags: ["onboarding", "sandbox"] },
    ],
    features: [
      { title: "Bulk card freeze/revoke action", framework: "RICE", score: 78, status: "Next", desc: "Multi-select cards, apply status change in one call." },
      { title: "Webhook delivery dashboard", framework: "RICE", score: 54, status: "Backlog", desc: "Surface retry attempts and final delivery state." },
    ],
    experiments: [
      { title: "Bulk revoke fake-door test", status: "Running", hypothesis: "Ops leads will use a bulk revoke action if available", risk: "Low" },
    ],
    assumptions: [
      { statement: "Fraud ops teams would trust a bulk action without a confirmation step per card", area: "Desirability", status: "Testing" },
      { statement: "Partner banks will adopt a sandbox with synthetic production data without compliance pushback", area: "Feasibility", status: "Untested" },
    ],
    research: [
      { query: "Virtual card issuance latency benchmarks — African fintech", type: "Competitor Analysis", date: "2026-08-02" },
      { query: "Bulk fraud response patterns in card platforms", type: "Product Analysis", date: "2026-07-20" },
    ],
    tree: {
      label: "Reduce time-to-contain fraud incidents", type: "outcome", children: [
        {
          label: "No bulk virtual card revocation", type: "opportunity", children: [
            { label: "Bulk freeze/revoke action", type: "solution", children: [
              { label: "Bulk revoke fake-door test", type: "experiment", children: [] },
            ] },
          ],
        },
        {
          label: "Webhook retry visibility for issuers", type: "opportunity", children: [
            { label: "Webhook delivery dashboard", type: "solution", children: [] },
          ],
        },
      ],
    },
  },
  {
    id: "wurka", ownerId: "u2", name: "Wurka Platform", initials: "WK", color: T.data,
    description: "Vendor onboarding & field operations platform",
    trend: [2, 3, 3, 5, 4, 6, 7, 6, 9, 10, 12, 11],
    insights: [
      { title: "Onboarding drop-off at document upload", source: "Interview Notes", emotion: "Frustrated", text: "Vendors abandon onboarding at the document upload step — no progress indicator." },
      { title: "Push notification request", source: "Feature Request", emotion: "Curious", text: "Field agents want push notifications when a job status changes." },
    ],
    opportunities: [
      { title: "Vendor onboarding takes 3 manual approval steps", desc: "Each approval is a separate email round trip.", score: 69, status: "New", axes: [7, 6, 6, 7, 6, 5] },
      { title: "No mobile view for job-status tracking", desc: "Field agents rely on desk staff for updates.", score: 58, status: "Exploring", axes: [5, 6, 5, 6, 5, 6] },
    ],
    personas: [
      { name: "Ifeoma Nnamdi", role: "Field Agent", quote: "I find out my job changed when someone calls me.", goals: "Know job status changes the moment they happen", frustrations: "No visibility outside the office" },
    ],
    interviews: [
      { title: "Field agent shadowing session", interviewee: "Ifeoma Nnamdi", date: "2026-08-05", tags: ["field", "mobile"] },
    ],
    features: [
      { title: "Push notifications for job status", framework: "RICE", score: 61, status: "Backlog", desc: "Notify assigned agent on any status transition." },
    ],
    experiments: [],
    assumptions: [
      { statement: "Vendors will complete onboarding if shown a progress indicator", area: "Usability", status: "Untested" },
    ],
    research: [
      { query: "Vendor onboarding funnel benchmarks — logistics SaaS", type: "Market Insight", date: "2026-08-10" },
    ],
    tree: {
      label: "Cut vendor onboarding time by half", type: "outcome", children: [
        {
          label: "Vendor onboarding takes 3 manual approval steps", type: "opportunity", children: [
            { label: "Single-screen approval queue", type: "solution", children: [] },
          ],
        },
      ],
    },
  },
];

function personalWorkspaceFor(userId) {
  return {
    id: `personal-${userId}`, ownerId: userId, name: "Personal (no product)", initials: "—", color: T.textTertiary,
    description: "Your own notes and data, not tied to any product.", isPersonal: true,
    trend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    insights: [], opportunities: [], personas: [], interviews: [], features: [], experiments: [], assumptions: [], research: [], tree: null,
  };
}

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "discover", label: "Discover", icon: Target },
  { key: "import", label: "Import", icon: Upload },
  { key: "opportunities", label: "Opportunities", icon: TrendingUp },
  { key: "personas", label: "Personas", icon: Users },
  { key: "interviews", label: "Interviews", icon: Mic },
  { key: "features", label: "Features", icon: ListChecks },
  { key: "experiments", label: "Experiments", icon: FlaskConical },
  { key: "assumptions", label: "Assumptions", icon: ShieldQuestion },
  { key: "research", label: "Research", icon: Globe },
  { key: "tree", label: "Solution Tree", icon: GitBranch },
];

const STATUS_COLOR = {
  New: T.info, Exploring: T.data, Validated: T.success, Building: T.signal, Shipped: T.textTertiary,
  Backlog: T.textTertiary, Next: T.info, "In Progress": T.signal, Done: T.success,
  Planned: T.info, Running: T.signal, Completed: T.success,
  Untested: T.textTertiary, Testing: T.info, Invalidated: T.danger,
};

const EMOTION_COLOR = { Frustrated: T.danger, Neutral: T.textTertiary, Curious: T.info, Delighted: T.success };
const INSIGHT_SOURCES = ["Customer Complaint", "Interview Notes", "Feature Request", "Sales Feedback", "Support Ticket", "Social Media", "Survey"];
const RESEARCH_TYPES = ["Product Analysis", "Market Insight", "Gap Analysis", "Competitor Analysis", "Customer Analysis", "Trend Analysis"];
const FRAMEWORKS = ["RICE", "ICE", "MoSCoW", "Kano", "Weighted Scoring"];
const ASSUMPTION_AREAS = ["Desirability", "Feasibility", "Viability", "Usability", "Risk", "Ethics"];

/* ---------------------------------------------------------------------- */
/* PRIMITIVES                                                              */
/* ---------------------------------------------------------------------- */
function ScoreDial({ value, size = 56, stroke = 6, color = T.signal, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 500ms cubic-bezier(.16,1,.3,1)" }} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-mono font-semibold" style={{ color: T.textPrimary, fontSize: size * 0.28 }}>{value}</span>
        {label && <span className="font-mono" style={{ color: T.textTertiary, fontSize: size * 0.13 }}>{label}</span>}
      </div>
    </div>
  );
}

function Label({ children }) {
  return <label className="text-[11px] font-body font-medium block mb-1.5" style={{ color: T.textSecondary }}>{children}</label>;
}
function TextInput(props) {
  return <input {...props} className="w-full px-3 py-2 rounded-lg text-[13px] font-body outline-none transition-colors"
    style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.textPrimary }} />;
}
function TextArea(props) {
  return <textarea {...props} rows={props.rows || 3} className="w-full px-3 py-2 rounded-lg text-[13px] font-body outline-none resize-none transition-colors"
    style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.textPrimary }} />;
}
function SelectInput({ options, ...props }) {
  return (
    <select {...props} className="w-full px-3 py-2 rounded-lg text-[13px] font-body outline-none appearance-none"
      style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.textPrimary }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function Field({ label, children }) {
  return <div className="mb-3.5"><Label>{label}</Label>{children}</div>;
}
function ScoreRow({ label, value, onChange, color = T.signal }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-body font-medium" style={{ color: T.textSecondary }}>{label}</span>
        <span className="font-mono text-[12px] font-semibold px-1.5 rounded" style={{ color, background: color + "1A" }}>{value}</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-current" style={{ accentColor: color }} />
    </div>
  );
}
function Button({ children, variant = "primary", ...props }) {
  const styles = {
    primary: { background: T.signal, color: T.bg, border: "none" },
    ghost: { background: "transparent", color: T.textSecondary, border: `1px solid ${T.border}` },
    data: { background: T.data, color: T.bg, border: "none" },
  };
  return (
    <button {...props} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-body font-medium transition-opacity hover:opacity-90"
      style={styles[variant]}>
      {children}
    </button>
  );
}
function Badge({ children, color }) {
  return <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded" style={{ color, background: color + "1A" }}>{children}</span>;
}

function Modal({ title, subtitle, onClose, children, footer, width = 480 }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(6,8,11,0.7)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="rounded-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{ width, background: T.bgElevated, border: `1px solid ${T.borderStrong}`, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div className="flex items-start justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div>
            <h3 className="font-display font-semibold text-[14px]" style={{ color: T.textPrimary }}>{title}</h3>
            {subtitle && <p className="text-[11px] font-body mt-0.5" style={{ color: T.textTertiary }}>{subtitle}</p>}
          </div>
          <button onClick={onClose}><X size={16} color={T.textTertiary} /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 shrink-0" style={{ borderTop: `1px solid ${T.border}` }}>{footer}</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* PRODUCT SELECTION                                                       */
/* ---------------------------------------------------------------------- */
function useProductSelection(products) {
  const [selectedId, setSelectedId] = useState(null);
  const product = products.find(p => p.id === selectedId) || null;
  return { product, selectedId, setSelectedId };
}

function ProductPicker({ products, prompt = "Select a product to continue" }) {
  const [, setId] = [null, () => {}];
  return null;
}

function ProductGate({ products, selectedId, setSelectedId, prompt, children }) {
  const product = products.find(p => p.id === selectedId);
  if (!product) {
    return (
      <div className="flex flex-col items-center py-16">
        <Boxes size={22} color={T.textTertiary} className="mb-3" />
        <p className="text-[13px] font-body font-medium mb-1" style={{ color: T.textPrimary }}>{prompt}</p>
        <p className="text-[11px] font-body mb-6" style={{ color: T.textTertiary }}>Data shown after this is scoped to the selected product only.</p>
        <div className="grid gap-3 w-full max-w-2xl" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {products.map(p => (
            <button key={p.id} onClick={() => setSelectedId(p.id)} className="text-left rounded-xl p-4 transition-colors hover:opacity-90"
              style={{ background: p.isPersonal ? "transparent" : T.bgElevated, border: `1px ${p.isPersonal ? "dashed" : "solid"} ${p.isPersonal ? T.borderStrong : T.border}` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-mono text-[11px] font-semibold mb-3"
                style={{ background: p.isPersonal ? "transparent" : p.color + "26", color: p.color, border: p.isPersonal ? `1px dashed ${T.borderStrong}` : "none" }}>{p.initials}</div>
              <p className="text-[13px] font-body font-semibold mb-1" style={{ color: T.textPrimary }}>{p.name}</p>
              <p className="text-[11px] font-body leading-relaxed" style={{ color: T.textTertiary }}>{p.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <button onClick={() => setSelectedId(null)} className="flex items-center gap-2 mb-4 px-2.5 py-1.5 rounded-lg" style={{ border: `1px solid ${T.border}` }}>
        <div className="w-4 h-4 rounded flex items-center justify-center font-mono text-[8px] font-semibold" style={{ background: product.color + "26", color: product.color }}>{product.initials}</div>
        <span className="text-[12px] font-body font-medium" style={{ color: T.textPrimary }}>{product.name}</span>
        <ChevronDown size={12} color={T.textTertiary} />
      </button>
      {children(product)}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SHELL                                                                   */
/* ---------------------------------------------------------------------- */
function Sidebar({ active, onNavigate }) {
  return (
    <aside className="h-full flex flex-col shrink-0" style={{ width: 224, background: T.bgElevated, borderRight: `1px solid ${T.border}` }}>
      <div className="flex items-center gap-2 px-4 h-14 shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: T.signal }}>
          <Target size={14} color={T.bg} strokeWidth={2.5} />
        </div>
        <span className="font-display font-semibold text-sm tracking-tight" style={{ color: T.textPrimary }}>Discovery Agent</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
        {NAV.map((item, i) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button key={item.key} onClick={() => onNavigate(item.key)}
              className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors"
              style={{ background: isActive ? T.bgOverlay : "transparent" }}>
              <span className="font-mono text-[10px] w-3 shrink-0" style={{ color: isActive ? T.signal : T.textTertiary }}>{i + 1}</span>
              <Icon size={16} strokeWidth={2} color={isActive ? T.signal : T.textSecondary} className="shrink-0" />
              <span className="text-[13px] font-body font-medium truncate" style={{ color: isActive ? T.textPrimary : T.textSecondary }}>{item.label}</span>
              {isActive && <span className="ml-auto w-1 h-1 rounded-full" style={{ background: T.signal }} />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function UserSwitcher({ users, currentId, onSwitch }) {
  const [open, setOpen] = useState(false);
  const current = users.find(u => u.id === currentId);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-lg"
        style={{ background: open ? T.bgOverlay : "transparent", border: `1px solid ${T.border}` }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-semibold shrink-0" style={{ background: current.color + "26", color: current.color }}>{current.initials}</div>
        <span className="text-[12px] font-body font-medium" style={{ color: T.textPrimary }}>{current.name}</span>
        <ChevronDown size={13} color={T.textTertiary} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-64 rounded-xl overflow-hidden z-20" style={{ background: T.bgElevated, border: `1px solid ${T.border}`, boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}>
          <div className="px-3 py-2 text-[11px] font-body font-medium" style={{ color: T.textTertiary, borderBottom: `1px solid ${T.border}` }}>Switch workspace user</div>
          {users.map(u => (
            <button key={u.id} onClick={() => { onSwitch(u.id); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
              style={{ background: u.id === currentId ? T.bgOverlay : "transparent" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-semibold shrink-0" style={{ background: u.color + "26", color: u.color }}>{u.initials}</div>
              <div className="leading-tight">
                <div className="text-[13px] font-body font-medium" style={{ color: T.textPrimary }}>{u.name}</div>
                <div className="text-[11px] font-body" style={{ color: T.textTertiary }}>{u.role}</div>
              </div>
              {u.id === currentId && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: T.success }} />}
            </button>
          ))}
          <div className="px-3 py-2 text-[11px] font-body" style={{ color: T.textTertiary, borderTop: `1px solid ${T.border}` }}>Each user only sees products and data in their own workspace.</div>
        </div>
      )}
    </div>
  );
}

function TopBar({ title, users, currentId, onSwitch, dark, setDark }) {
  return (
    <header className="h-14 flex items-center justify-between px-5 shrink-0" style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
      <h1 className="font-display font-semibold text-[15px]" style={{ color: T.textPrimary }}>{title}</h1>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-body" style={{ border: `1px solid ${T.border}`, color: T.textTertiary }}>
          <SearchIcon size={13} />Search
          <kbd className="font-mono text-[10px] px-1 rounded" style={{ background: T.bgOverlay, color: T.textTertiary }}>⌘K</kbd>
        </button>
        <button onClick={() => setDark(d => !d)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${T.border}` }}>
          {dark ? <Moon size={14} color={T.textSecondary} /> : <Sun size={14} color={T.textSecondary} />}
        </button>
        <UserSwitcher users={users} currentId={currentId} onSwitch={onSwitch} />
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------------- */
/* DASHBOARD                                                               */
/* ---------------------------------------------------------------------- */
function DashboardScreen({ products, sel }) {
  return (
    <ProductGate products={products} selectedId={sel.selectedId} setSelectedId={sel.setSelectedId} prompt="Which product are you researching?">
      {(product) => {
        const trendData = product.trend.map((v, i) => ({ i, v }));
        const radarData = product.opportunities.length
          ? ["Impact", "Frequency", "Urgency", "Biz Value", "Strategic", "Confidence"].map((axis, idx) => ({
              axis, value: product.opportunities.reduce((s, o) => s + o.axes[idx], 0) / product.opportunities.length,
            }))
          : [];
        return (
          <div className="flex flex-col gap-5">
            <div className="flex gap-3 flex-wrap">
              <StatCard label="Insights captured" value={product.insights.length} color={T.data} />
              <StatCard label="Active opportunities" value={product.opportunities.length} color={T.signal} />
              <StatCard label="Features prioritized" value={product.features.length} color={T.info} />
              <StatCard label="Experiments running" value={product.experiments.filter(e => e.status === "Running").length} color={T.danger} />
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
              <div className="rounded-xl p-4" style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-body font-semibold" style={{ color: T.textPrimary }}>Insight volume — last 12 weeks</span>
                  <ArrowUpRight size={14} color={T.textTertiary} />
                </div>
                <div style={{ height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={T.signal} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={T.signal} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip contentStyle={{ background: T.bgOverlay, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11 }} labelFormatter={() => ""} />
                      <Area type="monotone" dataKey="v" stroke={T.signal} strokeWidth={2} fill="url(#trendFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}>
                <span className="text-[12px] font-body font-semibold block mb-1" style={{ color: T.textPrimary }}>Score distribution</span>
                <div style={{ height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="70%">
                      <PolarGrid stroke={T.border} />
                      <PolarAngleAxis dataKey="axis" tick={{ fill: T.textTertiary, fontSize: 9 }} />
                      <Radar dataKey="value" stroke={T.data} fill={T.data} fillOpacity={0.28} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}>
              <span className="text-[12px] font-body font-semibold block mb-3" style={{ color: T.textPrimary }}>Top opportunities</span>
              <div className="flex flex-col gap-1">
                {product.opportunities.map((o, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-2 rounded-lg" style={{ borderBottom: i < product.opportunities.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <ScoreDial value={o.score} size={32} stroke={3.5} color={T.signal} />
                    <span className="text-[13px] font-body flex-1" style={{ color: T.textPrimary }}>{o.title}</span>
                    <Badge color={STATUS_COLOR[o.status]}>{o.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }}
    </ProductGate>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-xl p-4 flex-1 min-w-[140px]" style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}>
      <div className="text-[11px] font-body font-medium mb-2" style={{ color: T.textTertiary }}>{label}</div>
      <span className="font-mono font-semibold text-2xl" style={{ color: T.textPrimary }}>{value}</span>
      <div className="h-1 rounded-full mt-3 overflow-hidden" style={{ background: T.border }}>
        <div className="h-full rounded-full" style={{ width: "62%", background: color }} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* DISCOVER                                                                */
/* ---------------------------------------------------------------------- */
function DiscoverScreen({ products, sel }) {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ source: INSIGHT_SOURCES[0], description: "" });

  return (
    <ProductGate products={products} selectedId={sel.selectedId} setSelectedId={sel.setSelectedId} prompt="Which product are you researching?">
      {(product) => {
        const list = items || product.insights;
        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-body" style={{ color: T.textTertiary }}>{list.length} problems discovered</span>
              <Button onClick={() => { setForm({ source: INSIGHT_SOURCES[0], description: "" }); setModal(true); }}>
                <Plus size={13} />Add insight
              </Button>
            </div>
            {list.map((n, i) => (
              <div key={i} className="rounded-xl p-4 flex gap-3" style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}>
                <MessageSquareQuote size={16} color={T.textTertiary} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[13px] font-body font-medium mb-1" style={{ color: T.textPrimary }}>{n.title}</p>
                  <p className="text-[12px] font-body leading-relaxed mb-2" style={{ color: T.textSecondary }}>{n.text}</p>
                  <div className="flex items-center gap-2">
                    <Badge color={T.data}>{n.source}</Badge>
                    <Badge color={EMOTION_COLOR[n.emotion]}>{n.emotion}</Badge>
                  </div>
                </div>
              </div>
            ))}

            {modal && (
              <Modal title="Add insight" subtitle={product.name} onClose={() => setModal(false)}
                footer={<>
                  <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
                  <Button onClick={() => {
                    setItems([{ title: form.description.slice(0, 48) || "Untitled insight", text: form.description, source: form.source, emotion: "Neutral" }, ...list]);
                    setModal(false);
                  }}>Analyze & Save</Button>
                </>}>
                <Field label="Source">
                  <SelectInput options={INSIGHT_SOURCES} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
                </Field>
                <Field label="Description">
                  <TextArea rows={5} placeholder="Paste the raw feedback, complaint, or note…" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} />
                </Field>
                <p className="text-[11px] font-body" style={{ color: T.textTertiary }}>Sentiment, themes and keywords are tagged automatically on save.</p>
              </Modal>
            )}
          </div>
        );
      }}
    </ProductGate>
  );
}

/* ---------------------------------------------------------------------- */
/* IMPORT                                                                  */
/* ---------------------------------------------------------------------- */
const IMPORT_TYPES = [
  { ext: "PDF", icon: FileText }, { ext: "MD", icon: FileText }, { ext: "TXT", icon: FileText },
  { ext: "DOCX", icon: FileType }, { ext: "JSON", icon: FileJson },
];
const CLASSIFY_TARGETS = [
  { name: "Insight", desc: "Raw feedback, complaints, or requests extracted as discrete insights." },
  { name: "Opportunity", desc: "Recurring problems worth scoring and prioritizing." },
  { name: "Persona", desc: "Named user profiles inferred from repeated context." },
  { name: "Feature", desc: "Explicit feature requests ready for prioritization." },
  { name: "Assumption", desc: "Unverified beliefs surfaced in the text, flagged for validation." },
];

function ImportScreen() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl p-10 flex flex-col items-center text-center" style={{ border: `1px dashed ${T.borderStrong}`, background: T.bgElevated }}>
        <Upload size={22} color={T.signal} className="mb-3" />
        <p className="text-[13px] font-body font-semibold mb-1" style={{ color: T.textPrimary }}>Drag and drop a document, or click to browse</p>
        <p className="text-[11px] font-body mb-4" style={{ color: T.textTertiary }}>Content is parsed and classified automatically — nothing saves until you review it.</p>
        <div className="flex gap-2">
          {IMPORT_TYPES.map(t => (
            <span key={t.ext} className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded" style={{ color: T.textSecondary, background: T.bgOverlay, border: `1px solid ${T.border}` }}>
              <t.icon size={11} />{t.ext}
            </span>
          ))}
        </div>
      </div>
      <div>
        <span className="text-[12px] font-body font-semibold block mb-3" style={{ color: T.textPrimary }}>Extracted into</span>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {CLASSIFY_TARGETS.map(c => (
            <div key={c.name} className="rounded-xl p-3.5" style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}>
              <p className="text-[12px] font-body font-semibold mb-1" style={{ color: T.data }}>{c.name}</p>
              <p className="text-[11px] font-body leading-relaxed" style={{ color: T.textTertiary }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* OPPORTUNITIES                                                           */
/* ---------------------------------------------------------------------- */
const OPP_AXES = ["Impact", "Frequency", "Urgency", "Business Value", "Strategic Alignment", "Confidence"];

function OpportunitiesScreen({ products, sel }) {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", desc: "", axes: [5, 5, 5, 5, 5, 5] });

  return (
    <ProductGate products={products} selectedId={sel.selectedId} setSelectedId={sel.setSelectedId} prompt="Which product are you looking for opportunities in?">
      {(product) => {
        const list = items || product.opportunities;
        const total = Math.round((form.axes.reduce((a, b) => a + b, 0) / 6) * 10);
        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <button className="flex items-center gap-1.5 text-[12px] font-body px-2.5 py-1.5 rounded-lg" style={{ border: `1px solid ${T.border}`, color: T.textSecondary }}>
                <Filter size={12} /> All statuses
              </button>
              <Button onClick={() => { setForm({ title: "", desc: "", axes: [5, 5, 5, 5, 5, 5] }); setModal(true); }}>
                <Plus size={13} /> New opportunity
              </Button>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {list.map((o, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}>
                  <div className="flex items-start gap-3 mb-3">
                    <ScoreDial value={o.score} size={52} stroke={5} color={T.signal} label="score" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-body font-medium leading-snug mb-1.5" style={{ color: T.textPrimary }}>{o.title}</p>
                      <Badge color={STATUS_COLOR[o.status]}>{o.status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {["Imp", "Freq", "Urg", "Biz", "Strat", "Conf"].map((label, idx) => (
                      <div key={label} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: T.border }}>
                          <div style={{ width: `${o.axes[idx] * 10}%`, height: "100%", background: T.data }} />
                        </div>
                        <span className="text-[8px] font-mono" style={{ color: T.textTertiary }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {modal && (
              <Modal title="New opportunity" subtitle={product.name} onClose={() => setModal(false)} width={440}
                footer={<>
                  <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
                  <Button onClick={() => {
                    setItems([{ title: form.title || "Untitled opportunity", desc: form.desc, score: total, status: "New", axes: form.axes }, ...list]);
                    setModal(false);
                  }}>Create</Button>
                </>}>
                <Field label="Title"><TextInput placeholder="e.g. Delayed card issuance for partner banks" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="Description"><TextArea placeholder="What's the problem, and who feels it?" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} /></Field>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-body font-medium" style={{ color: T.textSecondary }}>Scoring (1–10 per axis)</span>
                  <span className="font-mono text-[12px] font-semibold" style={{ color: T.signal }}>Total {total}</span>
                </div>
                {OPP_AXES.map((axis, idx) => (
                  <ScoreRow key={axis} label={axis} value={form.axes[idx]} onChange={v => { const a = [...form.axes]; a[idx] = v; setForm({ ...form, axes: a }); }} />
                ))}
              </Modal>
            )}
          </div>
        );
      }}
    </ProductGate>
  );
}

/* ---------------------------------------------------------------------- */
/* PERSONAS                                                                */
/* ---------------------------------------------------------------------- */
const PERSONA_FIELDS = ["name", "role", "demographics", "goals", "frustrations", "behaviour", "needs", "quotes", "jtbd"];
const PERSONA_LABELS = { name: "Name", role: "Job / Role", demographics: "Demographics", goals: "Goals", frustrations: "Frustrations", behaviour: "Behaviour", needs: "Needs", quotes: "Quotes", jtbd: "Jobs to be done" };

function PersonasScreen({ products, sel }) {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(Object.fromEntries(PERSONA_FIELDS.map(f => [f, ""])));

  return (
    <ProductGate products={products} selectedId={sel.selectedId} setSelectedId={sel.setSelectedId} prompt="Which product are you researching?">
      {(product) => {
        const list = items || product.personas;
        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-end gap-2">
              <Button variant="data"><Sparkles size={13} /> Generate from insights</Button>
              <Button onClick={() => { setForm(Object.fromEntries(PERSONA_FIELDS.map(f => [f, ""]))); setModal(true); }}><Plus size={13} /> New persona</Button>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {list.map((p, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-[11px] font-semibold shrink-0" style={{ background: T.data + "26", color: T.data }}>
                      {(p.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-[13px] font-body font-semibold" style={{ color: T.textPrimary }}>{p.name || "Untitled persona"}</p>
                      <p className="text-[11px] font-body" style={{ color: T.textTertiary }}>{p.role}</p>
                    </div>
                  </div>
                  {p.quote && <div className="flex gap-2 mb-3"><Quote size={12} color={T.textTertiary} className="shrink-0 mt-0.5" /><p className="text-[12px] font-body italic leading-relaxed" style={{ color: T.textSecondary }}>{p.quote}</p></div>}
                  {p.goals && <p className="text-[11px] font-body mb-1"><span style={{ color: T.textTertiary }}>Goals — </span><span style={{ color: T.textSecondary }}>{p.goals}</span></p>}
                  {p.frustrations && <p className="text-[11px] font-body"><span style={{ color: T.textTertiary }}>Frustrations — </span><span style={{ color: T.textSecondary }}>{p.frustrations}</span></p>}
                </div>
              ))}
            </div>

            {modal && (
              <Modal title="New persona" subtitle={product.name} onClose={() => setModal(false)}
                footer={<>
                  <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
                  <Button onClick={() => { setItems([{ ...form, quote: form.quotes }, ...list]); setModal(false); }}>Create</Button>
                </>}>
                {PERSONA_FIELDS.map(f => (
                  <Field key={f} label={PERSONA_LABELS[f]}>
                    {f === "name" || f === "role" || f === "demographics"
                      ? <TextInput value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} />
                      : <TextArea rows={2} value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} />}
                  </Field>
                ))}
              </Modal>
            )}
          </div>
        );
      }}
    </ProductGate>
  );
}

/* ---------------------------------------------------------------------- */
/* INTERVIEWS                                                              */
/* ---------------------------------------------------------------------- */
function InterviewsScreen({ products, sel }) {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", interviewee: "", date: "", transcript: "" });

  return (
    <ProductGate products={products} selectedId={sel.selectedId} setSelectedId={sel.setSelectedId} prompt="Which product are you researching?">
      {(product) => {
        const list = items || product.interviews;
        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-body" style={{ color: T.textTertiary }}>{list.length} interviews</span>
              <Button onClick={() => { setForm({ title: "", interviewee: "", date: "", transcript: "" }); setModal(true); }}><Plus size={13} /> New interview</Button>
            </div>
            {list.map((iv, i) => (
              <div key={i} className="rounded-xl p-4 flex items-center gap-3" style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}>
                <Mic size={16} color={T.textTertiary} className="shrink-0" />
                <div className="flex-1">
                  <p className="text-[13px] font-body font-medium" style={{ color: T.textPrimary }}>{iv.title}</p>
                  <p className="text-[11px] font-body" style={{ color: T.textTertiary }}>{iv.interviewee} · {iv.date}</p>
                </div>
                {(iv.tags || []).map(t => <Badge key={t} color={T.data}>{t}</Badge>)}
              </div>
            ))}

            {modal && (
              <Modal title="New interview" subtitle={product.name} onClose={() => setModal(false)}
                footer={<>
                  <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
                  <Button onClick={() => { setItems([{ title: form.title || "Untitled interview", interviewee: form.interviewee, date: form.date || "—", tags: [] }, ...list]); setModal(false); }}>Analyze & Save</Button>
                </>}>
                <Field label="Title"><TextInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="Interviewee"><TextInput value={form.interviewee} onChange={e => setForm({ ...form, interviewee: e.target.value })} /></Field>
                <Field label="Date"><TextInput type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
                <Field label="Transcript"><TextArea rows={6} placeholder="Paste the interview transcript…" value={form.transcript} onChange={e => setForm({ ...form, transcript: e.target.value })} /></Field>
                <p className="text-[11px] font-body" style={{ color: T.textTertiary }}>Pain points, feature requests, emotions and assumptions are extracted automatically.</p>
              </Modal>
            )}
          </div>
        );
      }}
    </ProductGate>
  );
}

/* ---------------------------------------------------------------------- */
/* FEATURES                                                                */
/* ---------------------------------------------------------------------- */
const RICE_AXES = ["Reach", "Impact", "Confidence", "Effort"];

function FeaturesScreen({ products, sel }) {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", framework: "RICE", desc: "", rice: [5, 5, 5, 5] });

  return (
    <ProductGate products={products} selectedId={sel.selectedId} setSelectedId={sel.setSelectedId} prompt="Which product are you researching?">
      {(product) => {
        const list = items || product.features;
        const [reach, impact, conf, effort] = form.rice;
        const riceScore = Math.round((reach * impact * conf) / Math.max(1, effort));
        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-body" style={{ color: T.textTertiary }}>{list.length} features prioritized</span>
              <Button onClick={() => { setForm({ title: "", framework: "RICE", desc: "", rice: [5, 5, 5, 5] }); setModal(true); }}><Plus size={13} /> New feature</Button>
            </div>
            <div className="flex flex-col gap-2">
              {list.map((f, i) => (
                <div key={i} className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}>
                  <ScoreDial value={f.score} size={40} stroke={4} color={T.info} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-body font-medium" style={{ color: T.textPrimary }}>{f.title}</p>
                    <p className="text-[11px] font-body truncate" style={{ color: T.textTertiary }}>{f.desc}</p>
                  </div>
                  <Badge color={T.textTertiary}>{f.framework}</Badge>
                  <Badge color={STATUS_COLOR[f.status]}>{f.status}</Badge>
                </div>
              ))}
            </div>

            {modal && (
              <Modal title="New feature" subtitle={product.name} onClose={() => setModal(false)}
                footer={<>
                  <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
                  <Button onClick={() => { setItems([{ title: form.title || "Untitled feature", framework: form.framework, desc: form.desc, score: Math.min(100, riceScore), status: "Backlog" }, ...list]); setModal(false); }}>Create</Button>
                </>}>
                <Field label="Title"><TextInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="Framework"><SelectInput options={FRAMEWORKS} value={form.framework} onChange={e => setForm({ ...form, framework: e.target.value })} /></Field>
                <Field label="Description"><TextArea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} /></Field>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-body font-medium" style={{ color: T.textSecondary }}>RICE scoring (1–10 per axis)</span>
                  <span className="font-mono text-[12px] font-semibold" style={{ color: T.info }}>Score {riceScore}</span>
                </div>
                {RICE_AXES.map((axis, idx) => (
                  <ScoreRow key={axis} color={T.info} label={axis} value={form.rice[idx]} onChange={v => { const r = [...form.rice]; r[idx] = v; setForm({ ...form, rice: r }); }} />
                ))}
              </Modal>
            )}
          </div>
        );
      }}
    </ProductGate>
  );
}

/* ---------------------------------------------------------------------- */
/* EXPERIMENTS                                                             */
/* ---------------------------------------------------------------------- */
function ExperimentsScreen({ products, sel }) {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const blank = { title: "", hypothesis: "", successMetric: "", failureMetric: "", duration: "", cost: "", risk: "Low", learning: "", result: "" };
  const [form, setForm] = useState(blank);

  return (
    <ProductGate products={products} selectedId={sel.selectedId} setSelectedId={sel.setSelectedId} prompt="Which product are you researching?">
      {(product) => {
        const list = items || product.experiments;
        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-body" style={{ color: T.textTertiary }}>{list.length} experiments</span>
              <Button onClick={() => { setForm(blank); setModal(true); }}><Plus size={13} /> New experiment</Button>
            </div>
            {list.length === 0 && <EmptyRow text="No experiments yet for this product." />}
            {list.map((e, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[13px] font-body font-medium" style={{ color: T.textPrimary }}>{e.title}</p>
                  <Badge color={STATUS_COLOR[e.status]}>{e.status}</Badge>
                </div>
                <p className="text-[12px] font-body" style={{ color: T.textSecondary }}>{e.hypothesis}</p>
              </div>
            ))}

            {modal && (
              <Modal title="New experiment" subtitle={product.name} onClose={() => setModal(false)}
                footer={<>
                  <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
                  <Button onClick={() => { setItems([{ title: form.title || "Untitled experiment", hypothesis: form.hypothesis, status: "Planned", risk: form.risk }, ...list]); setModal(false); }}>Create</Button>
                </>}>
                <Field label="Title"><TextInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
                <Field label="Hypothesis"><TextArea placeholder="We believe that…" value={form.hypothesis} onChange={e => setForm({ ...form, hypothesis: e.target.value })} /></Field>
                <Field label="Success metric"><TextInput value={form.successMetric} onChange={e => setForm({ ...form, successMetric: e.target.value })} /></Field>
                <Field label="Failure metric"><TextInput value={form.failureMetric} onChange={e => setForm({ ...form, failureMetric: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Duration"><TextInput placeholder="e.g. 2 weeks" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} /></Field>
                  <Field label="Cost"><TextInput placeholder="e.g. ₦150,000" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} /></Field>
                </div>
                <Field label="Risk"><SelectInput options={["Low", "Medium", "High"]} value={form.risk} onChange={e => setForm({ ...form, risk: e.target.value })} /></Field>
                <Field label="Expected learning"><TextArea value={form.learning} onChange={e => setForm({ ...form, learning: e.target.value })} /></Field>
                <Field label="Result (optional)"><TextArea rows={2} value={form.result} onChange={e => setForm({ ...form, result: e.target.value })} /></Field>
              </Modal>
            )}
          </div>
        );
      }}
    </ProductGate>
  );
}

/* ---------------------------------------------------------------------- */
/* ASSUMPTIONS                                                             */
/* ---------------------------------------------------------------------- */
function AssumptionsScreen({ products, sel }) {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ statement: "", evidence: "" });

  return (
    <ProductGate products={products} selectedId={sel.selectedId} setSelectedId={sel.setSelectedId} prompt="Which product are you researching?">
      {(product) => {
        const list = items || product.assumptions;
        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-body" style={{ color: T.textTertiary }}>{list.length} assumptions mapped</span>
              <Button onClick={() => { setForm({ statement: "", evidence: "" }); setModal(true); }}><Plus size={13} /> New assumption</Button>
            </div>
            {list.map((a, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-[13px] font-body flex-1" style={{ color: T.textPrimary }}>{a.statement}</p>
                  <Badge color={STATUS_COLOR[a.status]}>{a.status}</Badge>
                </div>
                <Badge color={T.data}>{a.area}</Badge>
              </div>
            ))}

            {modal && (
              <Modal title="New assumption" subtitle={product.name} onClose={() => setModal(false)}
                footer={<>
                  <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
                  <Button onClick={() => { setItems([{ statement: form.statement, evidence: form.evidence, area: "Desirability", status: "Untested" }, ...list]); setModal(false); }}>Create</Button>
                </>}>
                <Field label="Statement"><TextArea placeholder="We believe that…" value={form.statement} onChange={e => setForm({ ...form, statement: e.target.value })} /></Field>
                <Field label="Evidence (optional)"><TextArea rows={2} value={form.evidence} onChange={e => setForm({ ...form, evidence: e.target.value })} /></Field>
                <p className="text-[11px] font-body" style={{ color: T.textTertiary }}>Area (Desirability, Feasibility, Viability, Usability, Risk, Ethics) is auto-classified from the statement.</p>
              </Modal>
            )}
          </div>
        );
      }}
    </ProductGate>
  );
}

/* ---------------------------------------------------------------------- */
/* RESEARCH                                                                */
/* ---------------------------------------------------------------------- */
function ResearchScreen({ products, sel }) {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [active, setActive] = useState(0);
  const [form, setForm] = useState({ question: "", name: "", type: RESEARCH_TYPES[0] });

  return (
    <ProductGate products={products} selectedId={sel.selectedId} setSelectedId={sel.setSelectedId} prompt="Which product are you researching?">
      {(product) => {
        const list = items || product.research;
        const sel2 = list[active] || list[0];
        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-end">
              <Button onClick={() => { setForm({ question: "", name: product.name, type: RESEARCH_TYPES[0] }); setModal(true); }}><Plus size={13} /> New research</Button>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: "260px 1fr" }}>
              <div className="flex flex-col gap-1">
                {list.map((r, i) => (
                  <button key={i} onClick={() => setActive(i)} className="text-left rounded-lg p-3" style={{ background: i === active ? T.bgOverlay : "transparent", border: `1px solid ${i === active ? T.borderStrong : "transparent"}` }}>
                    <p className="text-[12px] font-body font-medium mb-1" style={{ color: T.textPrimary }}>{r.query}</p>
                    <Badge color={T.data}>{r.type}</Badge>
                  </button>
                ))}
              </div>
              <div className="rounded-xl p-5" style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}>
                {sel2 ? (
                  <>
                    <div className="flex items-center gap-2 mb-3"><Globe size={14} color={T.data} /><span className="text-[13px] font-body font-semibold" style={{ color: T.textPrimary }}>{sel2.query}</span></div>
                    <div className="flex items-center gap-2 mb-4"><Badge color={T.data}>{sel2.type}</Badge><span className="text-[11px] font-mono" style={{ color: T.textTertiary }}>{sel2.date}</span></div>
                    <p className="text-[12px] font-body leading-relaxed" style={{ color: T.textSecondary }}>Findings, competitor breakdown, market size and recommendations render here once the research run completes.</p>
                  </>
                ) : <EmptyRow text="No research yet for this product." />}
              </div>
            </div>

            {modal && (
              <Modal title="New research" subtitle={product.name} onClose={() => setModal(false)}
                footer={<>
                  <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
                  <Button onClick={() => { setItems([{ query: form.question || "Untitled research", type: form.type, date: "Today" }, ...list]); setModal(false); setActive(0); }}>Create</Button>
                </>}>
                <Field label="What do you want to research?"><TextArea placeholder="e.g. Competitor pricing for virtual card issuance in Nigeria" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} /></Field>
                <Field label="Product / solution name"><TextInput value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Research type"><SelectInput options={RESEARCH_TYPES} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} /></Field>
              </Modal>
            )}
          </div>
        );
      }}
    </ProductGate>
  );
}

function EmptyRow({ text }) {
  return <p className="text-[12px] font-body py-6 text-center" style={{ color: T.textTertiary }}>{text}</p>;
}

/* ---------------------------------------------------------------------- */
/* SOLUTION TREE                                                           */
/* ---------------------------------------------------------------------- */
const TREE_COLOR = { outcome: T.signal, opportunity: T.data, solution: T.info, experiment: T.success };

function flattenTree(node, depth, x, expanded, positions, parentPos) {
  const key = `${depth}-${positions.length}`;
  const isExpanded = expanded[key] !== false;
  positions.push({ key, node, depth, x, parentPos });
  if (isExpanded && node.children) {
    let childX = x;
    node.children.forEach((c, i) => {
      childX = x + i * 1;
      flattenTree(c, depth + 1, childX, expanded, positions, { depth, x });
    });
  }
  return positions;
}

function TreeScreen({ products, sel }) {
  const [expanded, setExpanded] = useState({});
  return (
    <ProductGate products={products} selectedId={sel.selectedId} setSelectedId={sel.setSelectedId} prompt="Which product's tree do you want to explore?">
      {(product) => {
        if (!product.tree) {
          return <EmptyRow text="No solution tree here — trees are built from product outcomes, not personal notes." />;
        }
        const colW = 220, rowH = 84;
        // simple layered layout: assign columns by depth, rows by order within depth
        const layers = [[product.tree]];
        let d = 0;
        while (layers[d] && layers[d].some(n => n.children && n.children.length && expanded[n.__id] !== false)) {
          const next = [];
          layers[d].forEach(n => { if (n.children && expanded[n.__id] !== false) next.push(...n.children); });
          if (!next.length) break;
          layers.push(next);
          d++;
          if (d > 6) break;
        }
        // assign ids + y positions
        let idc = 0;
        const withIds = (n) => { n.__id = `n${idc++}`; (n.children || []).forEach(withIds); return n; };
        withIds(product.tree);
        const layers2 = [[product.tree]];
        let dd = 0;
        while (true) {
          const cur = layers2[dd];
          const next = [];
          cur.forEach(n => { if (n.children && n.children.length && expanded[n.__id] !== false) next.push(...n.children); });
          if (!next.length) break;
          layers2.push(next);
          dd++;
          if (dd > 6) break;
        }
        const nodePos = {};
        layers2.forEach((layer, li) => layer.forEach((n, ni) => { nodePos[n.__id] = { x: 40 + li * colW, y: 40 + ni * rowH, node: n }; }));
        const width = 40 + layers2.length * colW;
        const height = 40 + Math.max(...layers2.map(l => l.length)) * rowH;

        const edges = [];
        layers2.forEach(layer => layer.forEach(n => {
          if (n.children && expanded[n.__id] !== false) {
            n.children.forEach(c => { if (nodePos[c.__id]) edges.push({ from: nodePos[n.__id], to: nodePos[c.__id] }); });
          }
        }));

        return (
          <div>
            <div className="flex items-center gap-4 mb-4">
              {Object.entries(TREE_COLOR).map(([k, c]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                  <span className="text-[11px] font-body capitalize" style={{ color: T.textSecondary }}>{k}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl overflow-auto" style={{ background: T.bgElevated, border: `1px solid ${T.border}`, maxHeight: 480 }}>
              <svg width={Math.max(width, 600)} height={Math.max(height, 300)}>
                {edges.map((e, i) => {
                  const x1 = e.from.x + 170, y1 = e.from.y + 20, x2 = e.to.x, y2 = e.to.y + 20;
                  const mx = (x1 + x2) / 2;
                  return <path key={i} d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none" stroke={T.border} strokeWidth={1.5} />;
                })}
                {Object.values(nodePos).map(({ x, y, node }) => {
                  const hasChildren = node.children && node.children.length > 0;
                  const isExpanded = expanded[node.__id] !== false;
                  return (
                    <g key={node.__id} transform={`translate(${x},${y})`} style={{ cursor: hasChildren ? "pointer" : "default" }}
                      onClick={() => hasChildren && setExpanded(e => ({ ...e, [node.__id]: !isExpanded }))}>
                      <rect width={170} height={44} rx={10} fill={T.bgOverlay} stroke={TREE_COLOR[node.type]} strokeWidth={1.5} />
                      <circle cx={14} cy={22} r={4} fill={TREE_COLOR[node.type]} />
                      <foreignObject x={26} y={6} width={132} height={34}>
                        <div style={{ fontFamily: "Inter,sans-serif", fontSize: 10.5, lineHeight: "13px", color: T.textPrimary, overflow: "hidden" }}>{node.label}</div>
                      </foreignObject>
                      {hasChildren && <text x={158} y={26} fontSize={10} fill={T.textTertiary}>{isExpanded ? "−" : "+"}</text>}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        );
      }}
    </ProductGate>
  );
}

const SCREEN_TITLE = { dashboard: "Dashboard", discover: "Discover", import: "Import", opportunities: "Opportunities", personas: "Personas", interviews: "Interviews", features: "Features", experiments: "Experiments", assumptions: "Assumptions", research: "Research", tree: "Solution Tree" };

/* ---------------------------------------------------------------------- */
/* ROOT                                                                    */
/* ---------------------------------------------------------------------- */
export default function App() {
  const [active, setActive] = useState("dashboard");
  const [currentUserId, setCurrentUserId] = useState("u1");
  const [dark, setDark] = useState(true);

  const userProducts = useMemo(
    () => [...PRODUCTS.filter(p => p.ownerId === currentUserId), personalWorkspaceFor(currentUserId)],
    [currentUserId]
  );

  // one selection hook per screen so each screen manages its own product context
  const selDash = useProductSelection(userProducts);
  const selDiscover = useProductSelection(userProducts);
  const selOpp = useProductSelection(userProducts);
  const selPersonas = useProductSelection(userProducts);
  const selInterviews = useProductSelection(userProducts);
  const selFeatures = useProductSelection(userProducts);
  const selExperiments = useProductSelection(userProducts);
  const selAssumptions = useProductSelection(userProducts);
  const selResearch = useProductSelection(userProducts);
  const selTree = useProductSelection(userProducts);

  const renderScreen = () => {
    switch (active) {
      case "dashboard": return <DashboardScreen products={userProducts} sel={selDash} />;
      case "discover": return <DiscoverScreen products={userProducts} sel={selDiscover} />;
      case "import": return <ImportScreen />;
      case "opportunities": return <OpportunitiesScreen products={userProducts} sel={selOpp} />;
      case "personas": return <PersonasScreen products={userProducts} sel={selPersonas} />;
      case "interviews": return <InterviewsScreen products={userProducts} sel={selInterviews} />;
      case "features": return <FeaturesScreen products={userProducts} sel={selFeatures} />;
      case "experiments": return <ExperimentsScreen products={userProducts} sel={selExperiments} />;
      case "assumptions": return <AssumptionsScreen products={userProducts} sel={selAssumptions} />;
      case "research": return <ResearchScreen products={userProducts} sel={selResearch} />;
      case "tree": return <TreeScreen products={userProducts} sel={selTree} />;
      default: return null;
    }
  };

  return (
    <div className="w-full h-full flex font-body" style={{ background: T.bg, minHeight: 640 }}>
      <style>{FONTS}</style>
      <Sidebar active={active} onNavigate={setActive} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={SCREEN_TITLE[active]} users={USERS} currentId={currentUserId} onSwitch={setCurrentUserId} dark={dark} setDark={setDark} />
        <main className="flex-1 overflow-y-auto p-5">{renderScreen()}</main>
      </div>
    </div>
  );
}
