import type { ChartItem } from "@/lib/analytics";

export function CategoryBars({ title, description, items, color = "var(--data)", limit = 8 }: { title: string; description: string; items: ChartItem[]; color?: string; limit?: number }) {
  const visible = items.filter(item => item.value > 0).sort((a, b) => b.value - a.value).slice(0, limit);
  if (!visible.length) return null;
  const max = Math.max(...visible.map(item => item.value));
  return <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5" aria-label={title}>
    <h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{description}</p>
    <div className="mt-5 space-y-3">{visible.map(item => <div key={item.label}>
      <div className="mb-1.5 flex items-start justify-between gap-3 text-xs"><span className="min-w-0 break-words text-[var(--text-secondary)]">{item.label}</span><strong className="font-mono text-[var(--text)]">{item.value}</strong></div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-tertiary)]" aria-hidden="true"><div className="h-full rounded-full" style={{ width: `${Math.max(3, item.value / max * 100)}%`, background: color }} /></div>
    </div>)}</div>
  </section>;
}

export function MonthlyTrend({ title, description, items }: { title: string; description: string; items: ChartItem[] }) {
  if (!items.some(item => item.value > 0)) return null;
  const max = Math.max(1, ...items.map(item => item.value));
  const step = items.length > 1 ? 280 / (items.length - 1) : 0;
  const points = items.map((item, index) => `${10 + index * step},${90 - item.value / max * 74}`).join(" ");
  const readable = items.map(item => `${item.label}: ${item.value}`).join(", ");
  return <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5" aria-label={title}>
    <h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{description}</p>
    <svg className="mt-5 h-36 w-full" viewBox="0 0 300 100" preserveAspectRatio="none" role="img" aria-label={readable}>
      <line x1="10" x2="290" y1="90" y2="90" stroke="var(--border-strong)" />
      <polyline points={points} fill="none" stroke="var(--data)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {items.map((item, index) => <circle key={index} cx={10 + index * step} cy={90 - item.value / max * 74} r="3.5" fill="var(--data)" stroke="var(--bg-secondary)" strokeWidth="1.5"><title>{item.label}: {item.value}</title></circle>)}
    </svg>
    <div className="mt-2 grid gap-1 text-center" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>{items.map((item, index) => <div key={index}><span className="block font-mono text-xs font-semibold">{item.value}</span><span className="block text-[10px] text-[var(--text-secondary)]">{item.label}</span></div>)}</div>
  </section>;
}
