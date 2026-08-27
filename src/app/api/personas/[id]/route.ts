import { NextRequest, NextResponse } from "next/server";
import { getRecord, deleteRecord } from "@/lib/storage";
import type { Persona } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const persona = await getRecord<Persona>("personas.json", id);
  if (!persona || persona.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(persona);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const persona = await getRecord<Persona>("personas.json", id);
  if (!persona || persona.productId !== productId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const deleted = await deleteRecord("personas.json", id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}