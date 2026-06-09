"use client";

import { useMemo, useState } from "react";
import type { Jersey, ConfederationId } from "@/lib/types";
import { CONFEDERATIONS } from "@/lib/types";
import { filterJerseys, sortJerseys } from "@/lib/catalog";
import { JerseyCard } from "./JerseyCard";

export function CatalogBrowser({ jerseys }: { jerseys: Jersey[] }) {
  const [query, setQuery] = useState("");
  const [confederation, setConfederation] = useState<ConfederationId | "all">("all");

  const sorted = useMemo(() => sortJerseys(jerseys), [jerseys]);
  const visible = useMemo(
    () => filterJerseys(sorted, { query, confederation }),
    [sorted, query, confederation],
  );

  const chips: { id: ConfederationId | "all"; name: string }[] = [
    { id: "all", name: "All" },
    ...CONFEDERATIONS.map((c) => ({ id: c.id, name: c.name })),
  ];

  return (
    <div className="px-3 pb-10">
      <div className="py-3">
        <label htmlFor="search" className="sr-only">Search your team</label>
        <input
          id="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your team…"
          className="w-full rounded-xl border border-white/10 bg-gz-surface px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-gz-red focus:outline-none focus:ring-2 focus:ring-gz-red"
        />
      </div>

      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-3" role="group" aria-label="Filter by confederation">
        {chips.map((c) => {
          const active = confederation === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => setConfederation(c.id)}
              className={`min-h-11 whitespace-nowrap rounded-full px-4 text-sm font-bold transition-colors duration-200 ${
                active ? "bg-gz-red text-white" : "bg-gz-surface text-white/70"
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-white/60">No jerseys match — try another team.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visible.map((j) => (
            <JerseyCard key={j._id} jersey={j} />
          ))}
        </div>
      )}
    </div>
  );
}
