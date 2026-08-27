import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getRecords } from "@/lib/storage";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, adminCredentials, createSessionToken, type SessionUser } from "@/lib/auth";
import type { User } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const admin = adminCredentials();
  let user: SessionUser | null = null;

  if (admin && admin.email === email && (await bcrypt.compare(password, admin.passwordHash))) {
    user = { id: "admin", name: "Admin", email: admin.email };
  } else {
    const users = await getRecords<User>("users.json");
    const record = users.find((item) => item.email === email);
    if (record && (await bcrypt.compare(password, record.passwordHash))) {
      user = { id: record.id, name: record.name, email: record.email };
    }
  }

  if (!user) {
    const message = admin && admin.email === email
      ? "Incorrect password. Try again."
      : "No account found with that email. Check the address or sign up.";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const token = await createSessionToken(user);
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
