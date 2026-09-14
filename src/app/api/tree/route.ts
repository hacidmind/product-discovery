import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { getOwnedProductId } from "@/lib/request-context";
import { parseTree } from "@/lib/solution-tree";

export async function GET(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const db = await getDatabase();
  const tree = await db.collection("tree").findOne({ productId }, { projection: { _id: 0 }, sort: { updatedAt: -1 } });
  return NextResponse.json(tree);
}
export async function POST(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json().catch(() => null);
  let tree;
  try { tree = parseTree(body); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid tree" }, { status: 400 }); }
  const db = await getDatabase();
  const existing = await db.collection("tree").findOne({ productId }, { sort: { updatedAt: -1 } });
  const conflict = () => NextResponse.json({ error: "This tree changed in another tab. Reload it before saving your changes." }, { status: 409 });
  if (existing && (body.revision ?? 0) !== (existing.revision ?? 0)) return conflict();
  const record = { ...tree, productId, revision: (existing?.revision ?? 0) + 1, updatedAt: new Date().toISOString() };
  if (existing) {
    // Legacy roots share the ID 'root'; scope the write to the owned database document.
    const updated = await db.collection("tree").updateOne({ _id: existing._id, productId, revision: existing.revision ?? { $exists: false } }, { $set: record });
    if (!updated.matchedCount) return conflict();
  } else {
    // Stable database identity prevents simultaneous first saves creating duplicate trees.
    const _id = new ObjectId(createHash("sha256").update(productId).digest("hex").slice(0, 24));
    try { await db.collection("tree").insertOne({ ...record, _id }); }
    catch (error) { if (error && typeof error === "object" && "code" in error && error.code === 11000) return conflict(); throw error; }
  }
  return NextResponse.json(record, { status: existing ? 200 : 201 });
}
