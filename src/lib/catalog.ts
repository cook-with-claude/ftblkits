import type { Product } from "@/lib/types";

export function isSoldOut(product: Product): boolean {
  return !product.inStock;
}

export interface CatalogFilter {
  query: string;
  team?: string | null;
  inStockOnly?: boolean;
}

export function filterProducts(products: Product[], filter: CatalogFilter): Product[] {
  const q = filter.query.trim().toLowerCase();
  return products.filter((p) => {
    if (filter.inStockOnly && !p.inStock) return false;
    if (filter.team && p.team !== filter.team) return false;
    if (q && !(p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q))) {
      return false;
    }
    return true;
  });
}

// In-stock first; preserves incoming order within each group (DB returns newest first).
export function sortProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => (a.inStock === b.inStock ? 0 : a.inStock ? -1 : 1));
}

// Unique team names, alphabetical — powers the team filter within a section.
// Callers pass regular kits only; a mystery tier's label is not a real team.
export function listTeams(products: Product[]): string[] {
  return [...new Set(products.filter((p) => !p.isMystery).map((p) => p.team))].sort((a, b) =>
    a.localeCompare(b),
  );
}

// Mystery "tier" listings (surprise kits chosen at fulfillment) — shown in their own
// section, never mixed into the main kit grid, arrivals rail, or search.
export function mysteryKits(products: Product[]): Product[] {
  return products.filter((p) => p.isMystery);
}

// Everything that is a normal, specific kit (a named team's shirt).
export function regularKits(products: Product[]): Product[] {
  return products.filter((p) => !p.isMystery);
}
