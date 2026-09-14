import { Card } from "@/components/ui";
import type { ResearchResult, CompetitorDetail } from "@/lib/types";

export function ResearchDetails({ research }: { research: ResearchResult }) {
  const market = research.marketSizeDetail;
  const competitors: CompetitorDetail[] = research.competitorDetails?.length ? research.competitorDetails : research.competitors.map(name => ({ name, description: "" }));
  return <div className="mt-6 grid gap-6 lg:grid-cols-2">
    {competitors.length > 0 && <Card className="p-5"><h2 className="mb-4 text-base font-semibold">Competitor landscape</h2><div className="space-y-3">{competitors.map((competitor, index) => <details key={index} className="rounded-lg border border-[var(--border)] p-3"><summary className="cursor-pointer text-sm font-medium">{competitor.name}</summary><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{competitor.description}</p>{"funding" in competitor && competitor.funding && <p className="mt-2 text-xs">Funding: {competitor.funding}</p>}{"marketShare" in competitor && competitor.marketShare && <p className="mt-2 text-xs">Market share: {competitor.marketShare}</p>}{"strengths" in competitor && competitor.strengths?.length ? <TextList title="Strengths" items={competitor.strengths} /> : null}{"weaknesses" in competitor && competitor.weaknesses?.length ? <TextList title="Weaknesses" items={competitor.weaknesses} /> : null}</details>)}</div></Card>}
    {market && <Card className="p-5"><h2 className="mb-3 text-base font-semibold">Market detail</h2><p className="text-sm leading-6 text-[var(--text-secondary)]">{market.total}</p><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{market.growth}</p>{market.segments?.length ? <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><caption className="mb-2 text-left font-semibold">Market segments</caption><thead><tr><th className="py-2">Segment</th><th>Value</th><th>Share</th></tr></thead><tbody>{market.segments.map(segment => <tr key={segment.name} className="border-t border-[var(--border)]"><td className="py-2 pr-3">{segment.name}</td><td className="pr-3">{segment.value}</td><td>{segment.share}</td></tr>)}</tbody></table></div> : null}{market.regions?.length ? <TextList title="Regions" items={market.regions.map(region => `${region.name}: ${region.share}`)} /> : null}{market.drivers?.length ? <TextList title="Growth drivers" items={market.drivers} /> : null}{market.barriers?.length ? <TextList title="Barriers" items={market.barriers} /> : null}</Card>}
  </div>;
}

function TextList({ title, items }: { title: string; items: string[] }) {
  return <div className="mt-3"><h3 className="text-xs font-semibold">{title}</h3><ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-[var(--text-secondary)]">{items.map((item, index) => <li key={index}>{item}</li>)}</ul></div>;
}
