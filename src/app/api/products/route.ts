import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createRecord, getRecords } from "@/lib/storage";
import type { Product } from "@/lib/types";
import { getRequestUser } from "@/lib/request-context";
import { databaseFailureResponse } from "@/lib/database-errors";

export async function GET(request: NextRequest) {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    try {
    const products = await getRecords<Product>("products.json");
    const ownedProducts = products.filter((product) => product.userId === user.id);
    const db = await (await import("@/lib/mongodb")).getDatabase();
    const ownedIds = ownedProducts.map((product) => product.id);
    const countDocs = ownedIds.length > 0
        ? await db.collection("research").aggregate([
              { $match: { productId: { $in: ownedIds } } },
              { $group: { _id: "$productId", count: { $sum: 1 } } },
          ]).toArray()
        : [];
    const researchCounts = new Map(countDocs.map((entry) => [entry._id, entry.count]));
    const withResearchCounts = ownedProducts.map((product) => ({
        ...product,
        researchCount: researchCounts.get(product.id) ?? 0,
    }));
    return NextResponse.json(withResearchCounts);
    } catch (error) { const response = databaseFailureResponse(error); if (response) return response; throw error; }
}

export async function POST(request: NextRequest) {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (name.length > 100) return NextResponse.json({ error: "Use a workspace name of 100 characters or fewer" }, { status: 400 });
    if (!name) return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    try {
    const products = await getRecords<Product>("products.json");
    const existing = products.find((product) => product.userId === user.id && product.name.toLowerCase() === name.toLowerCase());
    if (existing) return NextResponse.json(
        { error: `You already have a research workspace named "${existing.name}". Choose it from the switcher or use a different name.` },
        { status: 409 },
    );
    const now = new Date().toISOString();
    return NextResponse.json(await createRecord("products.json", { id: randomUUID(), userId: user.id, name, createdAt: now, updatedAt: now }), { status: 201 });
    } catch (error) { const response = databaseFailureResponse(error); if (response) return response; throw error; }
}
