import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/request-context";
import { getDatabase } from "@/lib/mongodb";
import type { Product } from "@/lib/types";
import { databaseFailureResponse } from "@/lib/database-errors";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
  const db = await getDatabase();
  const owned = await db.collection<Product>("products").find({ userId: user.id }, { projection: { _id: 0 } }).toArray();
  const ids = owned.map(product => product.id);
  // Exclude ambiguous legacy name-based IDs from cross-workspace report reads.
  const counts = await db.collection("products").aggregate<{ _id: string; count: number }>([
    { $match: { id: { $in: ids } } }, { $group: { _id: "$id", count: { $sum: 1 } } },
  ]).toArray();
  const safeIds = counts.filter(entry => entry.count === 1).map(entry => entry._id);
  const reports = await db.collection("research").find({ productId: { $in: safeIds } }, {
    projection: { _id: 0, id: 1, productId: 1, query: 1, product: 1, category: 1, createdAt: 1 },
  }).sort({ createdAt: -1 }).toArray();
  const products = owned.map(product => ({ ...product, researchCount: reports.filter(report => report.productId === product.id).length }));
  return NextResponse.json({ products, reports });
  } catch (error) { const response = databaseFailureResponse(error); if (response) return response; throw error; }
}
