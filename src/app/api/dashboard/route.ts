import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getOwnedProductId } from "@/lib/request-context";

const FEED_PER_TYPE = 20;
const FEED_TOTAL = 15;

type FeedItem = { type: string; title: string; createdAt: string };

export async function GET(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });

  const db = await getDatabase();
  const filter = { productId };

  const [
    totalInsights,
    totalOpportunities,
    totalPersonas,
    totalInterviews,
    totalFeatures,
    totalExperiments,
    totalAssumptions,
    topOpportunities,
    topFeatures,
    recentInsights,
    themeDocs,
    researchDocs,
    feedInsights,
    feedOpportunities,
    feedPersonas,
    feedInterviews,
    feedFeatures,
    feedExperiments,
    feedAssumptions,
    feedResearch,
  ] = await Promise.all([
    db.collection("insights").countDocuments(filter),
    db.collection("opportunities").countDocuments(filter),
    db.collection("personas").countDocuments(filter),
    db.collection("interviews").countDocuments(filter),
    db.collection("features").countDocuments(filter),
    db.collection("experiments").countDocuments(filter),
    db.collection("assumptions").countDocuments(filter),
    db.collection("opportunities").find(filter).sort({ totalScore: -1 }).limit(5).toArray(),
    db.collection("features").find(filter).sort({ totalScore: -1 }).limit(5).toArray(),
    db.collection("insights").find(filter).sort({ createdAt: -1 }).limit(5).toArray(),
    db.collection("insights").find(filter, { projection: { _id: 0, themes: 1 } }).toArray(),
    db.collection("research").find(filter, { projection: { _id: 0, id: 1, product: 1, recommendations: 1 } }).sort({ createdAt: -1 }).toArray(),
    db.collection("insights").find(filter, { projection: { _id: 0, title: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(FEED_PER_TYPE).toArray(),
    db.collection("opportunities").find(filter, { projection: { _id: 0, title: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(FEED_PER_TYPE).toArray(),
    db.collection("personas").find(filter, { projection: { _id: 0, name: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(FEED_PER_TYPE).toArray(),
    db.collection("interviews").find(filter, { projection: { _id: 0, title: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(FEED_PER_TYPE).toArray(),
    db.collection("features").find(filter, { projection: { _id: 0, title: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(FEED_PER_TYPE).toArray(),
    db.collection("experiments").find(filter, { projection: { _id: 0, title: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(FEED_PER_TYPE).toArray(),
    db.collection("assumptions").find(filter, { projection: { _id: 0, statement: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(FEED_PER_TYPE).toArray(),
    db.collection("research").find(filter, { projection: { _id: 0, query: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(FEED_PER_TYPE).toArray(),
  ]);

  const themeCount = new Map<string, number>();
  for (const doc of themeDocs) {
    const themes = Array.isArray(doc.themes) ? doc.themes : [];
    for (const theme of themes) {
      themeCount.set(theme, (themeCount.get(theme) ?? 0) + 1);
    }
  }
  const commonProblems = Array.from(themeCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([theme, count]) => ({ theme, count }));

  const feedItems: FeedItem[] = [
    ...feedInsights.map((d) => ({ type: "insight", title: d.title, createdAt: d.createdAt })),
    ...feedOpportunities.map((d) => ({ type: "opportunity", title: d.title, createdAt: d.createdAt })),
    ...feedPersonas.map((d) => ({ type: "persona", title: d.name, createdAt: d.createdAt })),
    ...feedInterviews.map((d) => ({ type: "interview", title: d.title, createdAt: d.createdAt })),
    ...feedFeatures.map((d) => ({ type: "feature", title: d.title, createdAt: d.createdAt })),
    ...feedExperiments.map((d) => ({ type: "experiment", title: d.title, createdAt: d.createdAt })),
    ...feedAssumptions.map((d) => ({ type: "assumption", title: d.statement, createdAt: d.createdAt })),
    ...feedResearch.map((d) => ({ type: "research", title: d.query, createdAt: d.createdAt })),
  ];
  feedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({
    stats: {
      totalInsights,
      totalOpportunities,
      totalPersonas,
      totalInterviews,
      totalFeatures,
      totalExperiments,
      totalAssumptions,
    },
    topOpportunities,
    commonProblems,
    topFeatures,
    recentInsights,
    researchResults: researchDocs,
    activityFeed: feedItems.slice(0, FEED_TOTAL),
  });
}