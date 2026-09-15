import { analyzeTranscript } from "@/lib/interview-analysis";
import { validateRecordInput } from "@/lib/record-validation";
import { NextRequest, NextResponse } from "next/server";
import { getRecords, createRecord, generateId, filterByProduct } from "@/lib/storage";
import { extractKeywords } from "@/lib/analysis";
import type { Interview } from "@/lib/types";
import { getOwnedProductId } from "@/lib/request-context";

export async function GET(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const interviews = await getRecords<Interview>("interviews.json");
  return NextResponse.json(filterByProduct(interviews, productId));
}

export async function POST(req: NextRequest) {
  const productId = await getOwnedProductId(req);
  if (!productId) return NextResponse.json({ error: "Choose an owned product workspace" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const validationError = validateRecordInput("interviews", body, req.method === "PATCH");
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
  const transcript = body.transcript || "";
  const analysis = analyzeTranscript(transcript);
  const tags = extractKeywords(transcript);

  const interview: Interview = {
    id: generateId(),
    productId,
    title: body.title || "Untitled Interview",
    transcript,
    interviewee: body.interviewee || "Anonymous",
    date: body.date || new Date().toISOString().split("T")[0],
    analysis,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = await createRecord("interviews.json", interview);
  return NextResponse.json(created, { status: 201 });
}
