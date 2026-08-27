import { NextRequest, NextResponse } from "next/server";
import { getRecord, deleteRecord, updateRecord } from "@/lib/storage";
import type { ResearchResult } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const result = await getRecord<ResearchResult>("research.json", id);
  if (!result || result.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const existing = await getRecord<ResearchResult>("research.json", id);
  if (!existing || existing.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const deleted = await deleteRecord("research.json", id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const existing = await getRecord<ResearchResult>("research.json", id);
  if (!existing || existing.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const updates: Partial<ResearchResult> = {};
  if (typeof body.notes === "string") updates.notes = body.notes;
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No supported updates" }, { status: 400 });
  const result = await updateRecord<ResearchResult>("research.json", id, updates);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}
