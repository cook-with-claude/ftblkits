"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { filterProducts, sortProducts, listCountries, latestArrivals } from "@/lib/catalog";
import { JerseyCard } from "./JerseyCard";

export function CatalogBrowser({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  const arrivals = useMemo(() => latestArrivals(products, 10), [products]);
  const countries = useMemo(() => listCountries(products), [products]);
  const sorted = useMemo(() => sortProducts(products), [products]);
  const visible = useMemo(
    () => filterProducts(sorted, { query, country, inStockOnly }),
    [sorted, query, country, inStockOnly],
  );

  const selectCountry = (c: string | null) => {
    setCountry(c);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  const hasFilters = query !== "" || country !== null || inStockOnly;

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* New arrivals rail */}
      {arrivals.length > 0 && (
        <section id="arrivals" className="scroll-mt-24 pt-12">
          <div className="flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase text-gz-navy sm:text-3xl">
              New Arrivals
            </h2>
            <span className="mb-1 text-xs font-bold uppercase tracking-wide text-gz-muted">
              Freshly stocked
            </span>
          </div>
          <div className="mt-1 h-1 w-16 rounded-full gz-flag-gradient" aria-hidden="true" />
          <div className="gz-no-scrollbar mt-4 flex snap-x gap-3 overflow-x-auto pb-2">
            {arrivals.map((product) => (
              <div key={product.id} className="w-40 shrink-0 snap-start sm:w-48">
                <JerseyCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shop by country */}
      {countries.length > 0 && (
        <section id="countries" className="scroll-mt-24 pt-12">
          <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase text-gz-navy sm:text-3xl">
            Shop by Country
          </h2>
          <div className="mt-1 h-1 w-16 rounded-full gz-flag-gradient" aria-hidden="true" />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectCountry(null)}
              aria-pressed={country === null}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-bold transition-colors duration-200 ${
                country === null
                  ? "border-gz-navy bg-gz-navy text-white"
                  : "border-gz-border bg-gz-surface text-gz-navy hover:border-gz-navy/40"
              }`}
            >
              All
            </button>
            {countries.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => selectCountry(c)}
                aria-pressed={country === c}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-bold transition-colors duration-200 ${
                  country === c
                    ? "border-gz-navy bg-gz-navy text-white"
                    : "border-gz-border bg-gz-surface text-gz-navy hover:border-gz-navy/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Full catalog */}
      <section id="catalog" className="scroll-mt-24 pb-16 pt-12">
        <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase text-gz-navy sm:text-3xl">
          {country ?? "All"} Kits
        </h2>
        <div className="mt-1 h-1 w-16 rounded-full gz-flag-gradient" aria-hidden="true" />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search jerseys</label>
            <input
              id="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search team or country…"
              className="w-full rounded-xl border border-gz-border bg-gz-surface px-4 py-3 text-base text-gz-text placeholder:text-gz-muted focus:border-gz-navy focus:outline-none focus:ring-2 focus:ring-gz-navy/40"
            />
          </div>
          <button
            type="button"
            onClick={() => setInStockOnly((v) => !v)}
            aria-pressed={inStockOnly}
            className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-bold transition-colors duration-200 ${
              inStockOnly
                ? "border-gz-green bg-gz-green text-white"
                : "border-gz-border bg-gz-surface text-gz-navy hover:border-gz-navy/40"
            }`}
          >
            In stock only
          </button>
        </div>

        {hasFilters && (
          <div className="mt-3 flex items-center gap-3 text-sm text-gz-muted">
            <span>
              {visible.length} {visible.length === 1 ? "kit" : "kits"}
            </span>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCountry(null);
                setInStockOnly(false);
              }}
              className="cursor-pointer font-bold text-gz-red hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {visible.length === 0 ? (
          <p className="py-16 text-center text-gz-muted">No jerseys match — try another team.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((product) => (
              <JerseyCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
