import { NextRequest, NextResponse } from "next/server";
import { getRecord } from "@/lib/storage";
import { generateResearchMarkdown } from "@/lib/research";
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

  const markdown = generateResearchMarkdown(result);

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.savedFile || `${result.product.replace(/\s+/g, "-").toLowerCase()}.md`}"`,
    },
  });
}