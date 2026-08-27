"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/auth-card";
import { Button, Input, Spinner } from "@/components/ui";
import { fetchSession, type SessionUser } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
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
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!EMAIL_RE.test(email.trim())) { setError("Please enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
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
      title="Create your account"
      subtitle="Start turning customer signals into product decisions."
      footer={<>Already have an account? <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">Log in</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input label="Full name" value={name} onChange={setName} placeholder="Ada Lovelace" autoComplete="name" autoFocus />
        <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" />
        <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" autoComplete="new-password" />
        {error && <p role="alert" className="rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs text-[var(--danger)]">{error}</p>}
        <Button type="submit" size="md" disabled={submitting} className="w-full justify-center">
          {submitting ? <><Spinner size={14} /> Creating account…</> : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-center text-[11px] text-[var(--text-tertiary)]">
        Your account is stored in the workspace database.
      </p>
    </AuthCard>
  );
}
