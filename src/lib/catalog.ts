import type { Jersey, Size, ConfederationId } from "@/lib/types";

export function isSoldOut(jersey: Jersey): boolean {
  return jersey.sizes.every((s) => !s.inStock);
}

export function availableSizes(jersey: Jersey): Size[] {
  return jersey.sizes.filter((s) => s.inStock).map((s) => s.size);
}

export function sortJerseys(jerseys: Jersey[]): Jersey[] {
  return [...jerseys].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.team.localeCompare(b.team);
  });
}

export interface CatalogFilter {
  query: string;
  confederation: ConfederationId | "all";
}

export function filterJerseys(jerseys: Jersey[], filter: CatalogFilter): Jersey[] {
  const q = filter.query.trim().toLowerCase();
  return jerseys.filter((j) => {
    const matchesQuery = q === "" || j.team.toLowerCase().includes(q);
    const matchesConf =
      filter.confederation === "all" || j.confederation.id === filter.confederation;
    return matchesQuery && matchesConf;
  });
}
