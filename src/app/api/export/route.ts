import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getOwnedProductId, getRequestUser } from "@/lib/request-context";

const COLLECTIONS = ["insights", "opportunities", "personas", "interviews", "features", "experiments", "assumptions", "research", "tree"] as const;

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const db = await getDatabase();
  const products = await db.collection("products").find({ userId: user.id }).toArray();
  const productId = await getOwnedProductId(req);
  const ownedProducts = productId ? products.filter((p) => p.id === productId) : products;
  const ids = ownedProducts.map((p) => p.id);
  const bundle: Record<string, unknown> = { products: ownedProducts };
  await Promise.all(
    COLLECTIONS.map(async (name) => {
      bundle[name] = ids.length > 0 ? await db.collection(name).find({ productId: { $in: ids } }).toArray() : [];
    })
  );
  const body = JSON.stringify(bundle, null, 2);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="discovery-backup.json"`,
    },
  });
}
