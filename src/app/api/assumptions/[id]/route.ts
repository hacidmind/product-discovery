import { NextRequest, NextResponse } from "next/server";
import { getRecord, updateRecord, deleteRecord } from "@/lib/storage";
import type { Assumption } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const assumption = await getRecord<Assumption>("assumptions.json", id);
  if (!assumption || assumption.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(assumption);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json();
  const existing = await getRecord<Assumption>("assumptions.json", id);
  if (!existing || existing.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await updateRecord<Assumption>("assumptions.json", id, {
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
  const existing = await getRecord<Assumption>("assumptions.json", id);
  if (!existing || existing.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const deleted = await deleteRecord("assumptions.json", id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}