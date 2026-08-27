"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/auth-card";
import { Button, Input, Spinner } from "@/components/ui";
import { fetchSession, type SessionUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchSession().then((user) => {
      setReady(true);
      if (user) router.replace("/dashboard");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json().catch(() => null)) as { user?: SessionUser; error?: string } | null;
      if (!res.ok || !data?.user) {
        setError(data?.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      router.replace("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (!ready) return null;

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to continue your product discovery work."
      footer={<>Don&apos;t have an account? <Link href="/signup" className="font-medium text-[var(--accent)] hover:underline">Sign up</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" autoFocus />
        <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Your password" autoComplete="current-password" />
        {error && <p role="alert" className="rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs text-[var(--danger)]">{error}</p>}
        <Button type="submit" size="md" disabled={submitting} className="w-full justify-center">
          {submitting ? <><Spinner size={14} /> Logging in…</> : "Log in"}
        </Button>
      </form>
    </AuthCard>
  );
}
