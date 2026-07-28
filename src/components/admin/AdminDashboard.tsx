"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminProduct, AdminSection } from "@/lib/admin/types";
import { renameSectionMembership } from "@/lib/sections";
import { begin } from "@/lib/pending";
import { toast } from "@/lib/toast";
import { Spinner } from "@/components/feedback/Spinner";
import { FaviconIndicator } from "@/components/feedback/FaviconIndicator";
import { NavigationProgress } from "@/components/feedback/NavigationProgress";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { Toaster } from "@/components/feedback/Toaster";
import { fetchProducts, fetchSections } from "./api";
import { KitCard } from "./KitCard";
import { AddKitForm } from "./AddKitForm";
import { SectionsPanel } from "./SectionsPanel";

const tabBase =
  "min-h-[44px] cursor-pointer rounded-full px-4 py-2 text-sm font-extrabold uppercase tracking-wide transition-colors gz-base ease-gz-out";

export function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"kits" | "sections">("kits");
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [sections, setSections] = useState<AdminSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

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

  // Previously this awaited the request with no pending state and no error
  // handling, so a failed logout was indistinguishable from nothing happening.
  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    const end = begin();
    try {
      const res = await fetch("/api/admin/logout", {
        method: "POST",
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error("Log out failed");
      router.refresh();
    } catch {
      toast("Could not log out — check your connection and try again.");
      setLoggingOut(false);
    } finally {
      end();
    }
    // Deliberately not clearing loggingOut on success: router.refresh() swaps
    // this dashboard for the login form, and re-enabling the button first would
    // just flash it back to "Log out".
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
    const previous = sections?.find((section) => section.id === updated.id);
    setSections((prev) => (prev ? prev.map((s) => (s.id === updated.id ? updated : s)) : prev));
    // The rename RPC updates product arrays in the database. Keep this loaded
    // dashboard snapshot in step too; otherwise returning to the Kits tab shows
    // the old slug as "Unknown" and the next kit save is rejected.
    if (previous && previous.slug !== updated.slug) {
      setProducts((prev) =>
        prev
          ? prev.map((product) => {
              const next = renameSectionMembership(
                product.sections,
                previous.slug,
                updated.slug,
              );
              return next === product.sections ? product : { ...product, sections: next };
            })
          : prev,
      );
    }
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
              className="cursor-pointer rounded-full border border-gz-border px-4 py-2 text-sm font-bold text-gz-navy transition-colors gz-base ease-gz-out hover:bg-gz-bg-alt"
            >
              View shop
            </a>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              // min-w so the label swap does not resize the button mid-request.
              // Sized for the *pending* label — "Logging out…" plus the spinner
              // is the wider of the two states, and reserving only the idle
              // width let the button grow and shove the header sideways at the
              // exact moment it is meant to feel settled.
              className="flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-full bg-gz-navy px-4 py-2 text-sm font-bold text-white transition-opacity gz-base ease-gz-out hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingOut && <Spinner />}
              {loggingOut ? "Logging out…" : "Log out"}
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

            {/* Skeleton rather than the old "Loading kits…" line: the text
                occupied a single row and the real list then shoved the page
                down. These match the KitCard height, so nothing jumps.
                Mirrors what SectionsPanel already did. */}
            {products === null && !error && (
              <div className="mt-4 space-y-4" aria-busy="true" aria-label="Loading kits">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-40 rounded-2xl" />
                ))}
              </div>
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
      {/* /admin sits outside the storefront route group, so it does not inherit
          StorefrontShell's feedback layer and needs its own. Both read the same
          pending store that components/admin/api.ts feeds, so saves and uploads
          get the progress bar and the tab spinner too. */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <FaviconIndicator />
      <Toaster />
    </main>
  );
}
