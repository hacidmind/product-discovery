import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
    const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    if (session) return NextResponse.next();

    if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: ["/((?!(?:$|login|signup|api/auth|_next|favicon\\.ico|.*\\.[a-z]+$)).*)"],
};
