import { NextRequest, NextResponse } from "next/server";
import { getRecords, createRecord, updateRecord, generateId, filterByProduct } from "@/lib/storage";
import type { Persona } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const personas = await getRecords<Persona>("personas.json");
  return NextResponse.json(filterByProduct(personas, productId));
}

export async function POST(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json();

  const persona: Persona = {
    id: generateId(),
    productId,
    name: body.name,
    role: body.role || "",
    demographics: body.demographics || "",
    goals: body.goals || [],
    frustrations: body.frustrations || [],
    behaviors: body.behaviors || [],
    needs: body.needs || [],
    quotes: body.quotes || [],
    jobsToBeDone: body.jobsToBeDone || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = await createRecord("personas.json", persona);
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json();
  const existing = await getRecords<Persona>("personas.json");
  if (!existing.some(persona => persona.id === body.id && persona.productId === productId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await updateRecord<Persona>("personas.json", body.id, {
    ...body,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
