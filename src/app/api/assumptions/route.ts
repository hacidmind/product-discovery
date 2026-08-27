import { NextRequest, NextResponse } from "next/server";
import { getRecords, createRecord, updateRecord, generateId, filterByProduct } from "@/lib/storage";
import { classifyAssumption } from "@/lib/analysis";
import type { Assumption } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const assumptions = await getRecords<Assumption>("assumptions.json");
  return NextResponse.json(filterByProduct(assumptions, productId));
}

export async function POST(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json();

  const assumption: Assumption = {
    id: generateId(),
    productId,
    statement: body.statement,
    area: body.area || classifyAssumption(body.statement || ""),
    risk: body.risk || "medium",
    evidence: body.evidence || "",
    validationStatus: "untested",
    relatedExperimentIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = await createRecord("assumptions.json", assumption);
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json();
  const existing = await getRecords<Assumption>("assumptions.json");
  if (!existing.some(assumption => assumption.id === body.id && assumption.productId === productId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await updateRecord<Assumption>("assumptions.json", body.id, {
    ...body,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
