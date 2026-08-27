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
    return product ? product.id : null;
}