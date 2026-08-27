import { NextRequest, NextResponse } from "next/server";
import { getRecord, deleteRecord } from "@/lib/storage";
import type { Feature } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const feature = await getRecord<Feature>("features.json", id);
  if (!feature || feature.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(feature);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const feature = await getRecord<Feature>("features.json", id);
  if (!feature || feature.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const deleted = await deleteRecord("features.json", id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}