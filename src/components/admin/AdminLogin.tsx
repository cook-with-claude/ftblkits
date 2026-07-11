"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gz-bg-alt px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-gz-border bg-gz-surface p-8 shadow-lg"
      >
        <div className="gz-flagbar mb-6 h-1 w-16 rounded-full" aria-hidden="true" />
        <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase text-gz-navy">
          Manage Kits
        </h1>
        <p className="mt-1 text-sm text-gz-muted">Enter the manager password to continue.</p>

        <label htmlFor="password" className="mt-6 block text-xs font-extrabold uppercase tracking-widest text-gz-muted">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-gz-border bg-gz-bg px-4 py-3 text-base text-gz-text focus:border-gz-navy focus:outline-none focus:ring-2 focus:ring-gz-navy/40"
          required
        />

        {error && <p className="mt-3 text-sm font-bold text-gz-red">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full cursor-pointer rounded-full bg-gz-navy py-3 text-base font-extrabold uppercase tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Checking…" : "Log in"}
        </button>
      </form>
    </main>
  );
}
