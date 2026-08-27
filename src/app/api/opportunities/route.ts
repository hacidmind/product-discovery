import { NextRequest, NextResponse } from "next/server";
import { getRecords, createRecord, generateId, filterByProduct } from "@/lib/storage";
import { scoreOpportunity } from "@/lib/analysis";
import type { Opportunity } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const opportunities = await getRecords<Opportunity>("opportunities.json");
  return NextResponse.json(filterByProduct(opportunities, productId));
}

export async function POST(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json();

  const scores = {
    impact: body.scores?.impact || 5,
    frequency: body.scores?.frequency || 5,
    urgency: body.scores?.urgency || 5,
    businessValue: body.scores?.businessValue || 5,
    strategicAlignment: body.scores?.strategicAlignment || 5,
    confidence: body.scores?.confidence || 5,
  };

  const result = scoreOpportunity(scores);

  const opportunity: Opportunity = {
    id: generateId(),
    productId,
    title: body.title,
    description: body.description || "",
    scores,
    totalScore: result.totalScore,
    priority: result.priority,
    reasoning: result.reasoning,
    relatedInsightIds: body.relatedInsightIds || [],
    status: "new",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = await createRecord("opportunities.json", opportunity);
  return NextResponse.json(created, { status: 201 });
}
