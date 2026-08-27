"use client";

import Link from "next/link";
import { Sparkles } from "@/components/icons";

export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg)] px-4 py-10">
      <div className="w-full max-w-sm animate-fadein">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent)] text-[var(--bg)]"><Sparkles size={18} /></span>
          <span className="font-display text-lg font-bold tracking-tight text-[var(--text)]">Product Discovery</span>
        </Link>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
          <h1 className="font-display text-xl font-semibold text-[var(--text)]">{title}</h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">{footer}</p>
      </div>
    </div>
  );
}
