import { NextRequest, NextResponse } from "next/server";
import { getRecords, createRecord, generateId, filterByProduct } from "@/lib/storage";
import type { Experiment } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const experiments = await getRecords<Experiment>("experiments.json");
  return NextResponse.json(filterByProduct(experiments, productId));
}

export async function POST(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json();

  const experiment: Experiment = {
    id: generateId(),
    productId,
    title: body.title,
    hypothesis: body.hypothesis || "",
    metrics: {
      successMetric: body.metrics?.successMetric || "",
      failureMetric: body.metrics?.failureMetric || "",
    },
    duration: body.duration || "1 week",
    cost: body.cost || "Low",
    risk: body.risk || "low",
    expectedLearning: body.expectedLearning || "",
    results: body.results || "",
    status: "planned",
    relatedAssumptionIds: body.relatedAssumptionIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = await createRecord("experiments.json", experiment);
  return NextResponse.json(created, { status: 201 });
}
