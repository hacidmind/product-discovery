import { NextRequest, NextResponse } from "next/server";
import { getRecord, updateRecord, deleteRecord } from "@/lib/storage";
import type { Experiment } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const experiment = await getRecord<Experiment>("experiments.json", id);
  if (!experiment || experiment.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(experiment);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await updateRecord<Experiment>("experiments.json", id, {
    ...body,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const experiment = await getRecord<Experiment>("experiments.json", id);
  if (!experiment || experiment.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const deleted = await deleteRecord("experiments.json", id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}