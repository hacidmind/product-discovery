import { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession, type SessionUser } from "@/lib/auth";
import { getDatabase } from "@/lib/mongodb";
import type { Product } from "@/lib/types";

export async function getRequestUser(request: NextRequest): Promise<SessionUser | null> {
    return verifySession(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function getOwnedProductId(request: NextRequest): Promise<string | null> {
    const user = await getRequestUser(request);
    const productId = request.headers.get("x-product-context");
    if (!user || !productId) return null;

    const db = await getDatabase();
    const product = await db.collection<Product>("products").findOne({ id: productId, userId: user.id });
    if (!product) return null;
    // Legacy name-based IDs may belong to more than one account. Fail closed:
    // existing records cannot safely be assigned to either owner automatically.
    const collisions = await db.collection<Product>("products").countDocuments({ id: productId }, { limit: 2 });
    return collisions === 1 ? product.id : null;
}