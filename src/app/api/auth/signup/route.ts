import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createRecord, getRecords, generateId } from "@/lib/storage";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, createSessionToken } from "@/lib/auth";
import type { User } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const users = await getRecords<User>("users.json");
  if (users.some((user) => user.email === email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const user: User = {
    id: generateId(),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  };
  await createRecord("users.json", user);

  const token = await createSessionToken({ id: user.id, name: user.name, email: user.email });
  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
