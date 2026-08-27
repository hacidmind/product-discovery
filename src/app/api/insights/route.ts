import { NextRequest, NextResponse } from "next/server";
import { getRecords, createRecord, generateId, filterByProduct } from "@/lib/storage";
import { analyzeSentiment, extractKeywords, detectThemes, classifyInsight } from "@/lib/analysis";
import type { Insight, Emotion } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const insights = await getRecords<Insight>("insights.json");
  return NextResponse.json(filterByProduct(insights, productId));
}

export async function POST(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json();

  // Build an insight with automatic analysis
  const description = body.description || body.title || "";
  const title = body.title || description.slice(0, 80);

  const insight: Insight = {
    id: generateId(),
    productId,
    title,
    description,
    source: body.source || "other",
    category: body.category || classifyInsight(description),
    emotion: (body.emotion as Emotion) || analyzeSentiment(description),
    tags: body.tags || extractKeywords(description),
    themes: body.themes || detectThemes(description),
    quotes: body.quotes || [],
    priority: body.priority || "medium",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    interviewId: body.interviewId,
  };

  const created = await createRecord("insights.json", insight);
  return NextResponse.json(created, { status: 201 });
}
