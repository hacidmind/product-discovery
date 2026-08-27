"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BrainCircuit, GitBranch, Lightbulb, ListChecks, Sparkles, Target } from "@/components/icons";
import { fetchSession } from "@/lib/auth";

const FEATURES = [
  { icon: Lightbulb, title: "Capture signals", text: "Log customer feedback and let automatic analysis surface sentiment, themes, and keywords." },
  { icon: Target, title: "Score opportunities", text: "Turn repeated pain points into scored, prioritized opportunities across six axes." },
  { icon: ListChecks, title: "Prioritize features", text: "Rank the backlog with RICE, ICE, MoSCoW, Kano, or your own weighted model." },
  { icon: GitBranch, title: "Explore the tree", text: "Visualize outcomes, opportunities, solutions, and experiments in one living tree." },
];

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchSession().then((user) => {
      setReady(true);
      if (user) router.replace("/dashboard");
    });
  }, [router]);

  if (!ready) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent)] text-[var(--bg)]"><Sparkles size={18} /></span>
          <span className="font-display text-base font-bold tracking-tight">Product Discovery</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="rounded-[var(--radius)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text)]">Log in</Link>
          <Link href="/signup" className="rounded-[var(--radius)] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]">Sign up</Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pt-16 pb-14 text-center sm:pt-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
            <BrainCircuit size={13} className="text-[var(--accent)]" />
            One workspace for the whole discovery process
          </span>
          <h1 className="font-display mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Turn customer signals into <span className="text-[var(--accent)]">confident decisions</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
            Capture feedback, score opportunities, and prioritize features — a structured
            discovery workflow for product managers.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]">
              Create your account <ArrowRight size={15} />
            </Link>
            <Link href="/login" className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg-tertiary)]">
              Log in
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                <span className="mb-4 grid size-9 place-items-center rounded-lg bg-[var(--accent-light)] text-[var(--accent)]"><Icon size={17} /></span>
                <h2 className="text-sm font-semibold">{title}</h2>
                <p className="mt-1.5 text-xs leading-5 text-[var(--text-secondary)]">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-[var(--text-tertiary)] sm:flex-row">
          <span>Product Discovery Agent</span>
          <span>Built for product managers, one product at a time</span>
        </div>
      </footer>
    </div>
  );
}
