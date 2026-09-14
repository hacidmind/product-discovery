"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import Link from "next/link";

type Animation = { revert: () => void };
declare global {
  interface Window {
    gsap?: {
      fromTo: (target: HTMLElement, from: Record<string, unknown>, to: Record<string, unknown>) => Animation;
    };
    anime?: {
      animate: (targets: NodeListOf<HTMLAnchorElement>, options: Record<string, unknown>) => Animation;
      stagger: (delay: number) => unknown;
    };
  }
}

const motionReady = () => { window.dispatchEvent(new Event("discovery-motion-ready")); };

export function MotionLibraries() {
  return <>
    <Script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js" strategy="afterInteractive" onReady={motionReady} />
    <Script src="https://cdn.jsdelivr.net/npm/animejs@4.0.2/dist/bundles/anime.umd.min.js" strategy="afterInteractive" onReady={motionReady} />
  </>;
}

export function WorkspaceMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let animation: Animation | undefined;
    const update = () => {
      animation?.revert();
      if (media.matches && root.current && window.gsap) animation = window.gsap.fromTo(root.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" });
    };
    update();
    window.addEventListener("discovery-motion-ready", update);
    media.addEventListener("change", update);
    return () => {
      animation?.revert();
      window.removeEventListener("discovery-motion-ready", update);
      media.removeEventListener("change", update);
    };
  }, []);
  return <div ref={root}>{children}</div>;
}

const steps = [
  { href: "/discover", title: "Capture evidence", description: "Add customer feedback or interview notes.", number: "01" },
  { href: "/opportunities", title: "Find the opportunity", description: "Review customer problems and prioritize what matters.", number: "02" },
  { href: "/experiments", title: "Test your thinking", description: "Plan an experiment before committing to a solution.", number: "03" },
];

export function GettingStarted() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let animation: Animation | undefined;
    const update = () => {
      animation?.revert();
      if (media.matches && root.current && window.anime) animation = window.anime.animate(root.current.querySelectorAll("a"), {
        opacity: [0, 1], translateY: [16, 0], delay: window.anime.stagger(90), duration: 550, ease: "out(3)",
      });
    };
    update();
    media.addEventListener("change", update);
    window.addEventListener("discovery-motion-ready", update);
    return () => { animation?.revert(); media.removeEventListener("change", update); window.removeEventListener("discovery-motion-ready", update); };
  }, []);
  return <section ref={root} aria-labelledby="getting-started" className="discovery-guide mb-7 rounded-2xl border border-[var(--border-strong)] p-5 sm:p-7">
    <p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-[var(--accent)]">Your discovery workflow</p>
    <h2 id="getting-started" className="font-display text-xl font-semibold">From customer feedback to a confident next step.</h2>
    <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">Start with what you know. Build up the evidence, then decide what to test. You can return to any step at any time.</p>
    <div className="mt-5 grid gap-3 md:grid-cols-3">{steps.map(step => <Link key={step.href} href={step.href} className="group rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 transition-colors hover:border-[var(--accent)]">
      <span className="font-mono text-xs text-[var(--accent)]">{step.number} <span aria-hidden="true" className="float-right transition-transform group-hover:translate-x-1">↗</span></span>
      <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
      <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{step.description}</p>
    </Link>)}</div>
    <p className="mt-4 text-xs text-[var(--text-secondary)]">Already have research? <Link className="font-medium text-[var(--accent)] underline underline-offset-4" href="/import">Import a document</Link> or <Link className="font-medium text-[var(--accent)] underline underline-offset-4" href="/research">start a research query</Link>.</p>
  </section>;
}
