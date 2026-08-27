import { NextRequest, NextResponse } from "next/server";
import { getRecord, updateRecord, deleteRecord } from "@/lib/storage";
import type { Insight } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const insight = await getRecord<Insight>("insights.json", id);
  if (!insight || insight.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(insight);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const existing = await getRecord<Insight>("insights.json", id);
  if (!existing || existing.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const updated = await updateRecord<Insight>("insights.json", id, {
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
  const existing = await getRecord<Insight>("insights.json", id);
  if (!existing || existing.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const deleted = await deleteRecord("insights.json", id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}