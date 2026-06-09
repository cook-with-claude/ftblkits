"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { filterProducts, sortProducts } from "@/lib/catalog";
import { JerseyCard } from "./JerseyCard";

export function CatalogBrowser({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => sortProducts(products), [products]);
  const visible = useMemo(() => filterProducts(sorted, { query }), [sorted, query]);

  return (
    <div className="px-3 pb-10">
      <div className="py-3">
        <label htmlFor="search" className="sr-only">Search jerseys</label>
        <input
          id="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search team or country…"
          className="w-full rounded-xl border border-white/10 bg-gz-surface px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-gz-red focus:outline-none focus:ring-2 focus:ring-gz-red"
        />
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-white/60">No jerseys match — try another team.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visible.map((product) => (
            <JerseyCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
