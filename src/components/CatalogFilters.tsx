"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/types";
import { buildCatalogFilterUrl, filterProducts, sortProducts, listTeams } from "@/lib/catalog";
import { JerseyCard } from "./JerseyCard";

// Search + team + in-stock filtering over a list the server already scoped
// (all kits, or one section's kits).
//
// State is local rather than routed. Every page here is force-dynamic, so
// pushing a query param per keystroke via router.replace would mean a server
// round-trip per character. Instead we filter instantly from local state and
// mirror it into the URL with history.replaceState, which keeps the address bar
// shareable without triggering a Next navigation.
export function CatalogFilters({
  products,
  showTeams = true,
  emptyMessage = "No kits match — try another search.",
}: {
  products: Product[];
  showTeams?: boolean;
  emptyMessage?: string;
}) {
  // Seeded from the URL so a shared link restores the same view. Read straight
  // into the initial state rather than synced in an effect, which would render
  // an unfiltered list first and then correct it.
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [team, setTeam] = useState<string | null>(() => searchParams.get("team"));
  const [inStockOnly, setInStockOnly] = useState(() => searchParams.get("stock") === "1");

  const teams = useMemo(() => listTeams(products), [products]);
  const sorted = useMemo(() => sortProducts(products), [products]);
  const visible = useMemo(
    () => filterProducts(sorted, { query, team, inStockOnly }),
    [sorted, query, team, inStockOnly],
  );

  const hasFilters = query !== "" || team !== null || inStockOnly;

  // Debounced so typing does not write to history on every keystroke.
  useEffect(() => {
    const startLocation = {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
    };
    const startUrl = `${startLocation.pathname}${startLocation.search}${startLocation.hash}`;

    const id = setTimeout(() => {
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      // A Link click, back/forward navigation, or another URL update won the
      // race while this debounce was pending. Never write stale filters onto
      // that destination.
      if (currentUrl !== startUrl) return;

      const nextUrl = buildCatalogFilterUrl(startLocation, { query, team, inStockOnly });
      if (nextUrl !== currentUrl) window.history.replaceState(null, "", nextUrl);
    }, 250);
    return () => clearTimeout(id);
  }, [query, team, inStockOnly]);

  const clear = () => {
    setQuery("");
    setTeam(null);
    setInStockOnly(false);
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="kit-search" className="sr-only">
            Search kits
          </label>
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gz-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" strokeLinecap="round" />
          </svg>
          <input
            id="kit-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search kits or teams…"
            className="w-full rounded-xl border border-gz-border bg-gz-surface py-3 pl-11 pr-4 text-base text-gz-text placeholder:text-gz-muted focus:border-gz-navy focus:outline-none focus:ring-2 focus:ring-gz-navy/40"
          />
        </div>
        <button
          type="button"
          onClick={() => setInStockOnly((v) => !v)}
          aria-pressed={inStockOnly}
          className={`min-h-[44px] cursor-pointer rounded-xl border px-4 py-3 text-sm font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy/40 ${
            inStockOnly
              ? "border-gz-green bg-gz-green text-white"
              : "border-gz-border bg-gz-surface text-gz-navy hover:border-gz-navy/40"
          }`}
        >
          In stock only
        </button>
      </div>

      {showTeams && teams.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTeam(null)}
            aria-pressed={team === null}
            className={`min-h-[44px] cursor-pointer rounded-full border px-4 py-2 text-sm font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy/40 ${
              team === null
                ? "border-gz-navy bg-gz-navy text-white"
                : "border-gz-border bg-gz-surface text-gz-navy hover:border-gz-navy/40"
            }`}
          >
            All teams
          </button>
          {teams.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTeam(team === t ? null : t)}
              aria-pressed={team === t}
              className={`min-h-[44px] cursor-pointer rounded-full border px-4 py-2 text-sm font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy/40 ${
                team === t
                  ? "border-gz-navy bg-gz-navy text-white"
                  : "border-gz-border bg-gz-surface text-gz-navy hover:border-gz-navy/40"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 text-sm text-gz-muted" aria-live="polite">
        <span>
          {visible.length} {visible.length === 1 ? "kit" : "kits"}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={clear}
            className="cursor-pointer font-bold text-gz-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy/40"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-4">
        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gz-border bg-gz-bg-alt px-4 py-10 text-center text-sm text-gz-muted">
            {emptyMessage}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((product) => (
              <JerseyCard key={product.id} product={product} headingLevel="h2" />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
