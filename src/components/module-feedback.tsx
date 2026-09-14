"use client";

import Link from "next/link";

export function ModuleError({ message, retry }: { message: string; retry?: () => void }) {
  if (!message) return null;
  return <div role="alert" className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--danger)] bg-[var(--bg-secondary)] p-4 text-sm">
    <p className="min-w-0 flex-1">{message}</p>
    {message.includes("session has expired") ? <Link href="/login" className="font-medium underline">Sign in</Link> : retry && <button onClick={retry} className="font-medium underline underline-offset-4">Try again</button>}
  </div>;
}
