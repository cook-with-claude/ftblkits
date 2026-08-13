import type { Product } from "@/lib/types";
import { RETRO_SECTION_SLUG } from "@/lib/sizing";

export function isSoldOut(product: Product): boolean {
  return !product.inStock;
}

// Retro membership is already on the record — `sections` is in the query's
// COLUMNS and on the type — so filtering by era needs no new data, only a name.
export type CatalogEra = "all" | "current" | "retro";

export function isRetro(product: Product): boolean {
  return product.sections.includes(RETRO_SECTION_SLUG);
}

/**
 * True only when a list actually straddles both eras. The chips are pointless
 * on /kits/retro-kits (all retro) and on /kits/26-27-kits (none), so the caller
 * uses this to decide whether to render them at all.
 */
export function hasBothEras(products: Product[]): boolean {
  let current = false;
  let retro = false;
  for (const p of products) {
    if (isRetro(p)) retro = true;
    else current = true;
    if (current && retro) return true;
  }
  return false;
}

export type CatalogSort = "featured" | "newest" | "price-asc" | "price-desc" | "name";

export const CATALOG_SORTS: { value: CatalogSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A–Z" },
];

export function isCatalogSort(value: string | null): value is CatalogSort {
  return CATALOG_SORTS.some((s) => s.value === value);
}

export function isCatalogEra(value: string | null): value is CatalogEra {
  return value === "all" || value === "current" || value === "retro";
}

export interface CatalogFilter {
  query: string;
  team?: string | null;
  inStockOnly?: boolean;
  era?: CatalogEra;
}

// Sort is not a filter, but it belongs in the same shareable URL, so the one
// builder owns both.
export interface CatalogView extends CatalogFilter {
  sort?: CatalogSort;
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
  filter: CatalogView,
): string {
  const params = new URLSearchParams(location.search);
  if (filter.query) params.set("q", filter.query);
  else params.delete("q");
  if (filter.team) params.set("team", filter.team);
  else params.delete("team");
  if (filter.inStockOnly) params.set("stock", "1");
  else params.delete("stock");
  // "all" and "featured" are the defaults, so they stay out of the URL — a
  // shared link should not carry params that change nothing.
  if (filter.era && filter.era !== "all") params.set("era", filter.era);
  else params.delete("era");
  if (filter.sort && filter.sort !== "featured") params.set("sort", filter.sort);
  else params.delete("sort");

  const search = params.toString();
  return `${location.pathname}${search ? `?${search}` : ""}${location.hash}`;
}

export function filterProducts(products: Product[], filter: CatalogFilter): Product[] {
  const q = filter.query.trim().toLowerCase();
  const era = filter.era ?? "all";
  return products.filter((p) => {
    if (filter.inStockOnly && !p.inStock) return false;
    if (filter.team && p.team !== filter.team) return false;
    if (era !== "all" && isRetro(p) !== (era === "retro")) return false;
    if (q && !(p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q))) {
      return false;
    }
    return true;
  });
}

// Applied *within* the in-stock grouping, never across it: a sold-out kit at
// the top of a price sort is a worse result than a correct sort is a good one.
const COMPARATORS: Record<CatalogSort, ((a: Product, b: Product) => number) | null> = {
  // Both of these keep the incoming order, which is the caller's to decide:
  // the DB returns newest first, and /kits hands over a deliberately mixed
  // list so one import batch does not fill the first several screens.
  featured: null,
  newest: null,
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name),
};

// In-stock first; preserves incoming order within each group unless an explicit
// sort is asked for. Array.prototype.sort is stable, so "no comparator" really
// does mean "leave this group alone".
export function sortProducts(products: Product[], sort: CatalogSort = "featured"): Product[] {
  const compare = COMPARATORS[sort];
  return [...products].sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    return compare ? compare(a, b) : 0;
  });
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
