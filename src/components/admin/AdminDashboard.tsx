"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminProduct, AdminSection } from "@/lib/admin/types";
import { fetchProducts, fetchSections } from "./api";
import { KitCard } from "./KitCard";
import { AddKitForm } from "./AddKitForm";
import { SectionsPanel } from "./SectionsPanel";

const tabBase =
  "min-h-[44px] cursor-pointer rounded-full px-4 py-2 text-sm font-extrabold uppercase tracking-wide transition-colors duration-200";

export function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"kits" | "sections">("kits");
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [sections, setSections] = useState<AdminSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Both are loaded up front: the sections list feeds the Sections tab AND the
  // per-kit section picker, and the products list feeds the per-section counts.
  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load kits"));
    fetchSections()
      .then(setSections)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load sections"));
  }, []);

  const visible = useMemo(() => {
    if (!products) return [];
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q) ||
        // Match on section slug too, so typing "la-liga" surfaces that section's kits.
        p.sections.some((slug) => slug.includes(q)),
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

  function upsertSection(updated: AdminSection) {
    setSections((prev) => (prev ? prev.map((s) => (s.id === updated.id ? updated : s)) : prev));
  }
  function addSection(created: AdminSection) {
    setSections((prev) => (prev ? [...prev, created] : [created]));
  }
  function dropSection(id: string) {
    const removed = sections?.find((s) => s.id === id);
    setSections((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
    // The server strips the slug from every product in the same transaction;
    // mirror that locally so the kit list doesn't show a stale chip.
    if (removed) {
      setProducts((prev) =>
        prev
          ? prev.map((p) =>
              p.sections.includes(removed.slug)
                ? { ...p, sections: p.sections.filter((s) => s !== removed.slug) }
                : p,
            )
          : prev,
      );
    }
  }

  return (
    <main className="min-h-screen bg-gz-bg-alt">
      <header className="sticky top-0 z-20 bg-gz-bg/95 backdrop-blur">
        <div className="gz-flagbar h-1 w-full" aria-hidden="true" />
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <h1 className="font-[family-name:var(--font-display)] text-xl uppercase text-gz-navy">
            GoalZone Admin
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

          <nav className="flex w-full gap-2" aria-label="Admin sections">
            <button
              type="button"
              onClick={() => setTab("kits")}
              aria-current={tab === "kits" ? "page" : undefined}
              className={`${tabBase} ${
                tab === "kits"
                  ? "bg-gz-navy text-white"
                  : "border border-gz-border text-gz-navy hover:bg-gz-bg-alt"
              }`}
            >
              Kits{products ? ` (${products.length})` : ""}
            </button>
            <button
              type="button"
              onClick={() => setTab("sections")}
              aria-current={tab === "sections" ? "page" : undefined}
              className={`${tabBase} ${
                tab === "sections"
                  ? "bg-gz-navy text-white"
                  : "border border-gz-border text-gz-navy hover:bg-gz-bg-alt"
              }`}
            >
              Sections{sections ? ` (${sections.length})` : ""}
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {error && (
          <p className="mb-6 rounded-xl border border-gz-red/30 bg-gz-red/5 p-4 text-sm font-bold text-gz-red">
            {error}
          </p>
        )}

        {tab === "sections" ? (
          <SectionsPanel
            sections={sections}
            products={products}
            onCreated={addSection}
            onChange={upsertSection}
            onRemove={dropSection}
          />
        ) : (
          <>
            <AddKitForm onCreated={prepend} sections={sections ?? []} />

            <div className="mt-6">
              <label htmlFor="admin-search" className="sr-only">
                Search kits
              </label>
              <input
                id="admin-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search kits by name, team or section…"
                className="w-full rounded-xl border border-gz-border bg-gz-surface px-4 py-3 text-base text-gz-text placeholder:text-gz-muted focus:border-gz-navy focus:outline-none focus:ring-2 focus:ring-gz-navy/40"
              />
            </div>

            {products === null && !error && (
              <p className="mt-10 text-center text-gz-muted">Loading kits…</p>
            )}

            {products !== null && visible.length === 0 && (
              <p className="mt-10 text-center text-gz-muted">
                {products.length === 0
                  ? "No kits yet — add your first one above."
                  : "No kits match your search."}
              </p>
            )}

            <div className="mt-4 space-y-4">
              {visible.map((p) => (
                <KitCard
                  key={p.id}
                  product={p}
                  sections={sections ?? []}
                  onChange={upsert}
                  onRemove={drop}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
