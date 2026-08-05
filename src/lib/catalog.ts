import type { Product } from "@/lib/types";

export function isSoldOut(product: Product): boolean {
  return !product.inStock;
}

export interface CatalogFilter {
  query: string;
  team?: string | null;
  inStockOnly?: boolean;
}

export interface CatalogFilterLocation {
  pathname: string;
  search: string;
  hash: string;
}

// Builds the shareable filter URL without knowing about React or the browser.
// Unrelated query params and the current fragment are deliberately preserved.
export function buildCatalogFilterUrl(
  location: CatalogFilterLocation,
  filter: CatalogFilter,
): string {
  const params = new URLSearchParams(location.search);
  if (filter.query) params.set("q", filter.query);
  else params.delete("q");
  if (filter.team) params.set("team", filter.team);
  else params.delete("team");
  if (filter.inStockOnly) params.set("stock", "1");
  else params.delete("stock");

  const search = params.toString();
  return `${location.pathname}${search ? `?${search}` : ""}${location.hash}`;
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

// FNV-1a over the id, then murmur3's finalizer. Cheap and dependency-free.
// The finalizer is not optional: FNV's last step is a single multiply, so ids
// that share a prefix and differ only at the end — exactly what a batch import
// produces — come out linearly spaced and sort back into their original block.
// Mixing the bits afterwards is what actually scatters them.
function hashId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

// The catalog reaches the storefront newest-batch-first, so a browse page that
// shows everything opens on whichever collection was imported last — 368 retro
// shirts in a row, then the season kits, then the rest. Ordering by a hash of
// the id interleaves the batches instead.
//
// Deliberately deterministic rather than Math.random: the order has to survive a
// re-render and a page revisit, or a shopper loses their place in the grid every
// time they come back from a kit page. Keyed on the id alone, so a given kit sits
// in the same spot until the catalog itself changes.
export function shuffleCatalog(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const ha = hashId(a.id);
    const hb = hashId(b.id);
    // Tiebreak on the id so equal hashes still order consistently.
    return ha === hb ? a.id.localeCompare(b.id) : ha - hb;
  });
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
