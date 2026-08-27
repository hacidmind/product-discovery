import { NextRequest, NextResponse } from "next/server";
import { getRecords, createRecord, generateId, updateRecord, filterByProduct } from "@/lib/storage";
import { scoreRICE, scoreICE } from "@/lib/analysis";
import type { Feature, Framework } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const features = await getRecords<Feature>("features.json");
  return NextResponse.json(filterByProduct(features, productId));
}

export async function POST(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json();
  const framework: Framework = body.framework || "rice";
  let totalScore = 0;

  const scores = { ...body.scores };

  if (framework === "rice") {
    totalScore = scoreRICE(
      scores.reach || 1,
      scores.impact || 1,
      scores.confidence || 1,
      scores.effort || 1
    );
  } else if (framework === "ice") {
    totalScore = scoreICE(
      scores.iceImpact || 1,
      scores.iceConfidence || 1,
      scores.iceEase || 1
    );
  } else if (framework === "weighted") {
    // Weighted average from custom weights
    const weights = scores.weights || {};
    let weighted = 0;
    let totalWeight = 0;
    for (const [key, weight] of Object.entries(weights)) {
      weighted += (scores[key as keyof typeof scores] as number || 0) * (weight as number);
      totalWeight += (weight as number);
    }
    totalScore = totalWeight > 0 ? Math.round((weighted / totalWeight) * 100) / 100 : 0;
  } else if (framework === "moscow") {
    // Priority based on MoSCoW
    const moscowScores: Record<string, number> = { must: 10, should: 7, could: 4, wont: 1 };
    totalScore = moscowScores[scores.moscow || "could"] || 0;
  } else if (framework === "kano") {
    // Priority based on Kano
    const kanoScores: Record<string, number> = { basic: 8, performance: 6, delight: 4, indifferent: 2, reverse: 1 };
    totalScore = kanoScores[scores.kano || "indifferent"] || 0;
  }

  let priority = "medium";
  if (totalScore >= 7.5 || scores.moscow === "must") priority = "critical";
  else if (totalScore >= 5.5 || scores.moscow === "should") priority = "high";
  else if (totalScore >= 3.5) priority = "medium";
  else priority = "low";

  const feature: Feature = {
    id: generateId(),
    productId,
    title: body.title,
    description: body.description || "",
    framework,
    scores,
    totalScore,
    priority: body.priority || priority,
    status: "backlog",
    relatedOpportunityIds: body.relatedOpportunityIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = await createRecord("features.json", feature);
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json();
  const existing = await getRecords<Feature>("features.json");
  if (!existing.some(feature => feature.id === body.id && feature.productId === productId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await updateRecord<Feature>("features.json", body.id, {
    ...body,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
