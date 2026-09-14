import { NextResponse } from "next/server";

export function databaseErrorMessage(error: unknown): string {
  const detail = error as { code?: string; syscall?: string; cause?: { code?: string; syscall?: string } } | null;
  const code = detail?.code ?? detail?.cause?.code;
  const syscall = detail?.syscall ?? detail?.cause?.syscall;
  if (syscall === "querySrv" || (typeof error === "object" && error !== null && "message" in error && /querySrv/.test(String(error.message)))) {
    return "MongoDB DNS lookup failed. Check your DNS settings or use the standard Atlas connection string, then restart the app.";
  }
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return "MongoDB host lookup failed. Check your DNS settings and Atlas connection string, then retry.";
  }
  return "The database is unavailable. Check your MongoDB connection and try again.";
}

export function databaseFailureResponse(error: unknown) {
  const detail = error as { code?: string; name?: string; message?: string; cause?: { code?: string } } | null;
  const message = detail?.message ?? "";
  if (!/^(Mongo|Mongoose)/.test(detail?.name ?? "") && !/querySrv|MONGODB_URI/.test(message) && !["ESERVFAIL", "ENOTFOUND", "EAI_AGAIN", "ETIMEOUT"].includes(detail?.code ?? detail?.cause?.code ?? "")) return null;
  return NextResponse.json({ error: databaseErrorMessage(error) }, { status: 503 });
}
