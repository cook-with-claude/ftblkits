import type { Product } from "@/lib/types";

export function isSoldOut(product: Product): boolean {
  return !product.inStock;
}

export interface CatalogFilter {
  query: string;
  country?: string | null;
  inStockOnly?: boolean;
}

export function filterProducts(products: Product[], filter: CatalogFilter): Product[] {
  const q = filter.query.trim().toLowerCase();
  return products.filter((p) => {
    if (filter.inStockOnly && !p.inStock) return false;
    if (filter.country && p.country !== filter.country) return false;
    if (q && !(p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q))) {
      return false;
    }
    return true;
  });
}

// In-stock first; preserves incoming order within each group (DB returns newest first).
export function sortProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => (a.inStock === b.inStock ? 0 : a.inStock ? -1 : 1));
}

// Unique country names, alphabetical — powers the "Shop by Country" filter.
export function listCountries(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.country))].sort((a, b) => a.localeCompare(b));
}

// Newest first (DB already returns in that order); used for the arrivals rail.
export function latestArrivals(products: Product[], limit = 10): Product[] {
  return products.slice(0, limit);
}
