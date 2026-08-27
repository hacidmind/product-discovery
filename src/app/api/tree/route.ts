import { NextRequest, NextResponse } from "next/server";
import { getRecords, createRecord, updateRecord } from "@/lib/storage";
import type { TreeNode } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const trees = await getRecords<TreeNode>("tree.json");
  const ownedTrees = trees.filter(tree => tree.productId === productId);
  if (ownedTrees.length === 0) {
    return NextResponse.json(null);
  }
  return NextResponse.json(ownedTrees[0]);
}

export async function POST(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json();
  const trees = await getRecords<TreeNode>("tree.json");
  const ownedTrees = trees.filter(tree => tree.productId === productId);

  if (ownedTrees.length === 0) {
    const created = await createRecord("tree.json", { ...body, productId });
    return NextResponse.json(created, { status: 201 });
  }

  const updated = await updateRecord("tree.json", ownedTrees[0].id, { ...body, productId });
  return NextResponse.json(updated);
}