import { NextRequest, NextResponse } from "next/server";
import { getRecord, updateRecord, deleteRecord } from "@/lib/storage";
import { scoreOpportunity } from "@/lib/analysis";
import type { Opportunity } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const opp = await getRecord<Opportunity>("opportunities.json", id);
  if (!opp || opp.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(opp);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json();
  const existing = await getRecord<Opportunity>("opportunities.json", id);
  if (!existing || existing.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newScores = {
    impact: body.scores?.impact ?? existing.scores.impact,
    frequency: body.scores?.frequency ?? existing.scores.frequency,
    urgency: body.scores?.urgency ?? existing.scores.urgency,
    businessValue: body.scores?.businessValue ?? existing.scores.businessValue,
    strategicAlignment: body.scores?.strategicAlignment ?? existing.scores.strategicAlignment,
    confidence: body.scores?.confidence ?? existing.scores.confidence,
  };

  const result = scoreOpportunity(newScores);

  const updated = await updateRecord<Opportunity>("opportunities.json", id, {
    ...body,
    scores: newScores,
    totalScore: result.totalScore,
    priority: result.priority,
    reasoning: result.reasoning,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const existing = await getRecord<Opportunity>("opportunities.json", id);
  if (!existing || existing.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const deleted = await deleteRecord("opportunities.json", id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}