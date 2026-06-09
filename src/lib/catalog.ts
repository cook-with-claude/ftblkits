import type { Product } from "@/lib/types";

export function isSoldOut(product: Product): boolean {
  return !product.inStock;
}

export interface CatalogFilter {
  query: string;
}

export function filterProducts(products: Product[], filter: CatalogFilter): Product[] {
  const q = filter.query.trim().toLowerCase();
  if (q === "") return products;
  return products.filter(
    (p) => p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q),
  );
}

// In-stock first; preserves incoming order within each group (DB returns newest first).
export function sortProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => (a.inStock === b.inStock ? 0 : a.inStock ? -1 : 1));
}
