"use client";

import { useDeferredValue, useEffect, useId, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/types";
import {
  buildCatalogFilterUrl,
  filterProducts,
  hasBothEras,
  isCatalogEra,
  isCatalogSort,
  listTeams,
  shuffleCatalog,
  sortProducts,
  CATALOG_SORTS,
  type CatalogEra,
  type CatalogSort,
} from "@/lib/catalog";
import { JerseyCard } from "./JerseyCard";

// Past this many clubs the chip row stops being a shortcut: it wraps into a wall
// of pills that pushes the kits themselves below the fold, which is the opposite
// of a filter. The widest section that still reads well is the Champions League
// at 21 clubs; the season and club sections carry 85 and are the reason for the
// cap. Beyond it the same facet is offered as a <select>, which costs one line
// of layout regardless of how many clubs it holds.
const MAX_TEAM_CHIPS = 24;

// Rendering all 687 cards at once is most of what makes /kits feel heavy, and
// nobody scrolls that far before filtering. Revealed in blocks rather than
// paged: filtering here is instant and local, so a page control that reset the
// grid on every keystroke would fight it.
const PAGE_SIZE = 48;

const ERAS: { value: CatalogEra; label: string }[] = [
  { value: "all", label: "All" },
  { value: "current", label: "Current" },
  { value: "retro", label: "Retro" },
];

const CHIP_BASE =
  "min-h-[44px] cursor-pointer rounded-full border px-4 py-2 text-sm font-bold transition-colors gz-base ease-gz-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy";
const CHIP_ON = "border-gz-navy bg-gz-navy text-white";
const CHIP_OFF = "border-gz-border bg-gz-surface text-gz-navy hover:border-gz-navy/40";

// Search + era + team + in-stock filtering, and sorting, over a list the server
// already scoped (all kits, or one section's kits).
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
  mixed = false,
}: {
  products: Product[];
  showTeams?: boolean;
  emptyMessage?: string;
  // Whether the default order should interleave the import batches. Set by
  // /kits, where arrival order otherwise fills the first several screens with
  // whichever collection was imported last.
  mixed?: boolean;
}) {
  // Seeded from the URL so a shared link restores the same view. Read straight
  // into the initial state rather than synced in an effect, which would render
  // an unfiltered list first and then correct it.
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [team, setTeam] = useState<string | null>(() => searchParams.get("team"));
  const [inStockOnly, setInStockOnly] = useState(() => searchParams.get("stock") === "1");
  const [era, setEra] = useState<CatalogEra>(() => {
    const value = searchParams.get("era");
    return isCatalogEra(value) ? value : "all";
  });
  const [sort, setSort] = useState<CatalogSort>(() => {
    const value = searchParams.get("sort");
    return isCatalogSort(value) ? value : "featured";
  });
  const [limit, setLimit] = useState(PAGE_SIZE);
  const sortId = useId();
  const teamSelectId = useId();

  // The 250ms debounce below only ever guarded the URL write. The filter itself
  // ran on every keystroke, re-rendering the whole grid each time; deferring the
  // value keeps the input responsive while the list catches up.
  const deferredQuery = useDeferredValue(query);

  const teams = useMemo(() => listTeams(products), [products]);
  const teamChips = showTeams && teams.length > 1 && teams.length <= MAX_TEAM_CHIPS;
  const teamSelect = showTeams && teams.length > MAX_TEAM_CHIPS;
  const showEras = useMemo(() => hasBothEras(products), [products]);

  const ordered = useMemo(
    () => (mixed && sort === "featured" ? shuffleCatalog(products) : products),
    [mixed, sort, products],
  );
  const sorted = useMemo(() => sortProducts(ordered, sort), [ordered, sort]);
  const visible = useMemo(
    () => filterProducts(sorted, { query: deferredQuery, team, inStockOnly, era }),
    [sorted, deferredQuery, team, inStockOnly, era],
  );
  const shown = useMemo(() => visible.slice(0, limit), [visible, limit]);

  const hasFilters = query !== "" || team !== null || inStockOnly || era !== "all";

  // A changed result set starts from the top again — otherwise clearing a
  // filter after scrolling would leave hundreds of already-revealed cards.
  // Adjusted during render rather than in an effect, the same way the header
  // closes its menus on navigation: React applies it before painting, so the
  // over-long grid is never committed and then corrected.
  const viewKey = JSON.stringify([deferredQuery, team, inStockOnly, era, sort]);
  const [limitKey, setLimitKey] = useState(viewKey);
  if (limitKey !== viewKey) {
    setLimitKey(viewKey);
    setLimit(PAGE_SIZE);
  }

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

      const nextUrl = buildCatalogFilterUrl(startLocation, {
        query,
        team,
        inStockOnly,
        era,
        sort,
      });
      if (nextUrl !== currentUrl) window.history.replaceState(null, "", nextUrl);
    }, 250);
    return () => clearTimeout(id);
  }, [query, team, inStockOnly, era, sort]);

  const clear = () => {
    setQuery("");
    setTeam(null);
    setInStockOnly(false);
    setEra("all");
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
            className="w-full rounded-xl border border-gz-border bg-gz-surface py-3 pl-11 pr-4 text-base text-gz-text placeholder:text-gz-muted focus:border-gz-navy focus:outline-none focus:ring-2 focus:ring-gz-navy"
          />
        </div>
        <button
          type="button"
          onClick={() => setInStockOnly((v) => !v)}
          aria-pressed={inStockOnly}
          className={`min-h-[44px] cursor-pointer rounded-xl border px-4 py-3 text-sm font-bold transition-colors gz-base ease-gz-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy ${
            inStockOnly
              ? // Was white on #00a86b, which is 3.13:1 — under the 4.5:1 floor
                // for text this size. The navy the team chips already use is
                // 12.67:1 and keeps the whole control row on one active colour.
                "border-gz-navy bg-gz-navy text-white"
              : "border-gz-border bg-gz-surface text-gz-navy hover:border-gz-navy/40"
          }`}
        >
          In stock only
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {/* Era first: it is the coarsest cut, and until now the only way to see
            the 368 retro shirts on a mixed list was to know a club by name. */}
        {showEras && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by era">
            {ERAS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEra(option.value)}
                aria-pressed={era === option.value}
                className={`${CHIP_BASE} ${era === option.value ? CHIP_ON : CHIP_OFF}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <label htmlFor={sortId} className="text-xs font-extrabold uppercase tracking-widest text-gz-muted">
            Sort
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(e) => setSort(e.target.value as CatalogSort)}
            className="min-h-[44px] cursor-pointer rounded-xl border border-gz-border bg-gz-surface px-3 py-2 text-sm font-bold text-gz-navy focus:border-gz-navy focus:outline-none focus:ring-2 focus:ring-gz-navy"
          >
            {CATALOG_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* The chip cap is right — 85 clubs is a wall of pills — but suppressing
            the chips used to remove the facet entirely. A select costs one line
            however long the list is. */}
        {teamSelect && (
          <div className="flex items-center gap-2">
            <label
              htmlFor={teamSelectId}
              className="text-xs font-extrabold uppercase tracking-widest text-gz-muted"
            >
              Team
            </label>
            <select
              id={teamSelectId}
              value={team ?? ""}
              onChange={(e) => setTeam(e.target.value || null)}
              className="min-h-[44px] max-w-[14rem] cursor-pointer rounded-xl border border-gz-border bg-gz-surface px-3 py-2 text-sm font-bold text-gz-navy focus:border-gz-navy focus:outline-none focus:ring-2 focus:ring-gz-navy"
            >
              <option value="">All teams</option>
              {teams.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {teamChips && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTeam(null)}
            aria-pressed={team === null}
            className={`${CHIP_BASE} ${team === null ? CHIP_ON : CHIP_OFF}`}
          >
            All teams
          </button>
          {teams.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTeam(team === t ? null : t)}
              aria-pressed={team === t}
              className={`${CHIP_BASE} ${team === t ? CHIP_ON : CHIP_OFF}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 text-sm text-gz-muted" aria-live="polite">
        <span>
          {visible.length} {visible.length === 1 ? "kit" : "kits"}
          {shown.length < visible.length && ` · showing ${shown.length}`}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={clear}
            className="cursor-pointer font-bold text-gz-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy"
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
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {shown.map((product) => (
                <JerseyCard key={product.id} product={product} headingLevel="h2" />
              ))}
            </div>

            {shown.length < visible.length && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setLimit((n) => n + PAGE_SIZE)}
                  className="min-h-12 cursor-pointer rounded-full border-2 border-gz-navy px-8 text-sm font-extrabold uppercase tracking-wide text-gz-navy transition-colors gz-base ease-gz-out hover:bg-gz-navy hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy"
                >
                  Show more kits
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
