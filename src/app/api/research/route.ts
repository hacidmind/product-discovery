import { NextRequest, NextResponse } from "next/server";
import { getRecords, createRecord, filterByProduct } from "@/lib/storage";
import { performResearch } from "@/lib/research";
import type { ResearchResult } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const results = await getRecords<ResearchResult>("research.json");
  return NextResponse.json(filterByProduct(results, productId));
}

export async function POST(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  const product = typeof body?.product === "string" ? body.product.trim() : "";
  const category = body?.category;

  if (!query || query.length > 2000 || !product || product.length > 200 || !["product", "solution", "market_insight", "gap_analysis", "competitor", "trend"].includes(category)) {
    return NextResponse.json(
      { error: "query, product, and category are required" },
      { status: 400 }
    );
  }

  const result = await performResearch(query, product, category);
  result.productId = productId;
  result.savedFile = `research-${result.id.replace(/[^a-zA-Z0-9-]/g, "")}.md`;
  await createRecord("research.json", result);
  // Downloads are generated from the saved record, including on read-only hosts.
  return NextResponse.json(result, { status: 201 });
}
