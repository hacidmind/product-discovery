import { NextRequest, NextResponse } from "next/server";
import { getRecords, createRecord, filterByProduct } from "@/lib/storage";
import { performResearch, saveResearchMarkdown } from "@/lib/research";
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
  const body = await req.json();
  const { query, product, category } = body;

  if (!query || !product || !category) {
    return NextResponse.json(
      { error: "query, product, and category are required" },
      { status: 400 }
    );
  }

  const result = await performResearch(query, product, category);
  result.productId = productId;
  await createRecord("research.json", result);

  const savedFile = await saveResearchMarkdown(result);

  return NextResponse.json({ ...result, savedFile }, { status: 201 });
}
