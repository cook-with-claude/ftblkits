"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminProduct } from "@/lib/admin/types";
import { fetchProducts } from "./api";
import { KitCard } from "./KitCard";
import { AddKitForm } from "./AddKitForm";

export function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load kits"));
  }, []);

  const visible = useMemo(() => {
    if (!products) return [];
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q),
    );
  }, [products, query]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  function upsert(updated: AdminProduct) {
    setProducts((prev) => (prev ? prev.map((p) => (p.id === updated.id ? updated : p)) : prev));
  }
  function prepend(created: AdminProduct) {
    setProducts((prev) => (prev ? [created, ...prev] : [created]));
  }
  function drop(id: string) {
    setProducts((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
  }

  return (
    <main className="min-h-screen bg-gz-bg-alt">
      <header className="sticky top-0 z-20 bg-gz-bg/95 backdrop-blur">
        <div className="gz-flagbar h-1 w-full" aria-hidden="true" />
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <h1 className="font-[family-name:var(--font-display)] text-xl uppercase text-gz-navy">
            Manage Kits
          </h1>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer rounded-full border border-gz-border px-4 py-2 text-sm font-bold text-gz-navy transition-colors duration-200 hover:bg-gz-bg-alt"
            >
              View shop
            </a>
            <button
              type="button"
              onClick={logout}
              className="cursor-pointer rounded-full bg-gz-navy px-4 py-2 text-sm font-bold text-white transition-opacity duration-200 hover:opacity-90"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <AddKitForm onCreated={prepend} />

        <div className="mt-6">
          <label htmlFor="admin-search" className="sr-only">Search kits</label>
          <input
            id="admin-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search kits to edit…"
            className="w-full rounded-xl border border-gz-border bg-gz-surface px-4 py-3 text-base text-gz-text placeholder:text-gz-muted focus:border-gz-navy focus:outline-none focus:ring-2 focus:ring-gz-navy/40"
          />
        </div>

        {error && (
          <p className="mt-6 rounded-xl border border-gz-red/30 bg-gz-red/5 p-4 text-sm font-bold text-gz-red">
            {error}
          </p>
        )}

        {products === null && !error && (
          <p className="mt-10 text-center text-gz-muted">Loading kits…</p>
        )}

        {products !== null && visible.length === 0 && (
          <p className="mt-10 text-center text-gz-muted">
            {products.length === 0 ? "No kits yet — add your first one above." : "No kits match your search."}
          </p>
        )}

        <div className="mt-4 space-y-4">
          {visible.map((p) => (
            <KitCard key={p.id} product={p} onChange={upsert} onRemove={drop} />
          ))}
        </div>
      </div>
    </main>
  );
}
