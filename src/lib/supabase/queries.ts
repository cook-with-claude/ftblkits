import { cache } from "react";
import { unstable_cache } from "next/cache";
import { supabase } from "./client";
import type { Product } from "@/lib/types";
import { isUuid } from "@/lib/ids";
import { isValidSectionSlug, type NavGroup, type Section } from "@/lib/sections";
import { CATALOG_TAG } from "@/lib/cache-tags";
import {
  getMysteryProduct,
  getMysteryProductsInSection,
  getMysterySection,
  MYSTERY_PRODUCTS,
  MYSTERY_SECTIONS,
} from "@/lib/mystery";

// Every storefront page is force-dynamic, so before this each navigation paid
// for a fresh Supabase round trip — the dominant and most variable part of the
// wait, especially while a free-tier project is resuming from auto-pause.
//
// unstable_cache uses the Data Cache, which is independent of route dynamism:
// pages still render per-request (so nothing stale is ever served as HTML), but
// the database work behind them is shared. Admin writes purge CATALOG_TAG, so
// edits still appear immediately.

// A ceiling, not the mechanism. Tag purges are what keep the catalog fresh;
// this only bounds staleness if a purge fails to propagate through the hosting
// layer's cache handler.
const MAX_AGE_SECONDS = 300;

// Carries the caller's own "unavailable" value back out through the cache.
// Throwing is the only way to stop unstable_cache from storing a result, and a
// rejected promise is not cached — which is exactly the behaviour an outage
// needs.
class OutageSignal<Result> extends Error {
  constructor(readonly result: Result) {
    super("catalog unavailable");
  }
}

function cached<Args extends unknown[], Result extends { status: string }>(
  key: string,
  fn: (...args: Args) => Promise<Result>,
) {
  const inner = unstable_cache(
    async (...args: Args) => {
      const result = await fn(...args);
      // An outage is a fact about right now, not about the data. Caching it
      // would pin every reader to the error state for the full TTL — long
      // after Supabase came back — and make the "Try again" button on the
      // error boundary useless, which is the opposite of what it promises.
      if (result.status === "unavailable") throw new OutageSignal(result);
      return result;
    },
    [key],
    { revalidate: MAX_AGE_SECONDS, tags: [CATALOG_TAG] },
  );

  return async (...args: Args): Promise<Result> => {
    try {
      return await inner(...args);
    } catch (err) {
      if (err instanceof OutageSignal) return err.result as Result;
      throw err;
    }
  };
}

const COLUMNS =
  "id, name, team, price, sizes, image_url, in_stock, description, is_mystery, sections";

const SECTION_COLUMNS = "id, slug, label, nav_group, sort_order, accent, description, hidden";

interface ProductRow {
  id: string;
  name: string;
  team: string;
  price: number | string;
  sizes: string[] | null;
  image_url: string | null;
  in_stock: boolean;
  description: string | null;
  is_mystery: boolean | null;
  sections: string[] | null;
}

interface SectionRow {
  id: string;
  slug: string;
  label: string;
  nav_group: string;
  sort_order: number;
  accent: string | null;
  description: string | null;
  hidden: boolean;
}

export type CatalogResult =
  | { status: "ok"; products: Product[] }
  | { status: "unavailable"; products: [] };

export type ProductResult =
  | { status: "ok"; product: Product }
  | { status: "not_found" }
  | { status: "unavailable" };

export type SectionsResult =
  | { status: "ok"; sections: Section[] }
  | { status: "unavailable"; sections: [] };

export type SectionResult =
  | { status: "ok"; section: Section }
  | { status: "not_found" }
  | { status: "unavailable" };

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    team: row.team,
    price: Number(row.price),
    sizes: row.sizes ?? [],
    imageUrl: row.image_url,
    inStock: row.in_stock,
    description: row.description,
    isMystery: row.is_mystery ?? false,
    sections: row.sections ?? [],
  };
}

function toSection(row: SectionRow): Section {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    // A CHECK constraint keeps nav_group inside NAV_GROUPS, so the cast is safe.
    navGroup: row.nav_group as NavGroup,
    sortOrder: row.sort_order,
    accent: row.accent,
    description: row.description,
    hidden: row.hidden,
  };
}

async function fetchAllProducts(): Promise<CatalogResult> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(COLUMNS)
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      // The seeded catalog shares one created_at, so without a tiebreaker the
      // row order (and therefore "New Arrivals") varies between requests.
      .order("id", { ascending: true });
    if (error) throw new Error(error.message);
    return { status: "ok", products: (data ?? []).map((row) => toProduct(row as ProductRow)) };
  } catch (err) {
    // Preserve the distinction between a real empty catalog and an outage so
    // the storefront can show an honest temporary-unavailability state.
    console.error("[queries] getAllProducts failed:", err);
    return { status: "unavailable", products: [] };
  }
}

async function fetchProductById(id: string): Promise<ProductResult> {
  if (!isUuid(id)) return { status: "not_found" };

  try {
    const { data, error } = await supabase
      .from("products")
      .select(COLUMNS)
      .eq("id", id)
      .eq("hidden", false)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data
      ? { status: "ok", product: toProduct(data as ProductRow) }
      : { status: "not_found" };
  } catch (err) {
    // Do not turn an outage into a false 404; the page error boundary shows a
    // retryable temporary-unavailability state instead.
    console.error(`[queries] getProductById(${id}) failed:`, err);
    return { status: "unavailable" };
  }
}

// Every visible section, ordered the way the nav renders them. RLS restricts the
// public key to hidden = false, so a hidden section is invisible here without any
// application-level filter.
async function fetchSections(): Promise<SectionsResult> {
  try {
    const { data, error } = await supabase
      .from("sections")
      .select(SECTION_COLUMNS)
      .eq("hidden", false)
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true });
    if (error) throw new Error(error.message);
    return { status: "ok", sections: (data ?? []).map((row) => toSection(row as SectionRow)) };
  } catch (err) {
    // The nav renders on every page, so callers degrade to a minimal header
    // rather than failing the whole request.
    console.error("[queries] getSections failed:", err);
    return { status: "unavailable", sections: [] };
  }
}

async function fetchSectionBySlug(slug: string): Promise<SectionResult> {
  // Reject malformed slugs before they reach PostgREST, mirroring how
  // getProductById guards with isUuid.
  if (!isValidSectionSlug(slug)) return { status: "not_found" };

  try {
    const { data, error } = await supabase
      .from("sections")
      .select(SECTION_COLUMNS)
      .eq("slug", slug)
      .eq("hidden", false)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data
      ? { status: "ok", section: toSection(data as SectionRow) }
      : { status: "not_found" };
  } catch (err) {
    console.error(`[queries] getSectionBySlug(${slug}) failed:`, err);
    return { status: "unavailable" };
  }
}

// Scoped to one section rather than filtering the whole catalog client-side, so
// the payload stays proportional to the section as the catalog grows.
async function fetchProductsInSection(slug: string): Promise<CatalogResult> {
  if (!isValidSectionSlug(slug)) return { status: "ok", products: [] };

  try {
    const { data, error } = await supabase
      .from("products")
      .select(COLUMNS)
      .eq("hidden", false)
      .contains("sections", [slug])
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
    if (error) throw new Error(error.message);
    return { status: "ok", products: (data ?? []).map((row) => toProduct(row as ProductRow)) };
  } catch (err) {
    console.error(`[queries] getProductsInSection(${slug}) failed:`, err);
    return { status: "unavailable", products: [] };
  }
}

// Bounded query for the home page's arrivals rail, so the landing page no longer
// pulls the entire catalog just to show ten cards.
async function fetchLatestProducts(limit = 10): Promise<CatalogResult> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(COLUMNS)
      .eq("hidden", false)
      .eq("is_mystery", false)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .limit(limit);
    if (error) throw new Error(error.message);
    return { status: "ok", products: (data ?? []).map((row) => toProduct(row as ProductRow)) };
  } catch (err) {
    console.error("[queries] getLatestProducts failed:", err);
    return { status: "unavailable", products: [] };
  }
}

// The public read layer. Two layers of memoisation, each solving a different
// problem:
//
//   cache()          — dedupes within a single render. generateMetadata and the
//                      page body ask for the same record, and the layout and the
//                      page both ask for the sections; this collapses those.
//   unstable_cache() — shares the result across requests and purges on write.
//
// unstable_cache folds the call arguments into its key, so the parameterised
// ones stay correctly separated per id / slug / limit.
// The raw layer is exported too, for tests. They assert the semantics these
// functions own — empty catalog vs outage, row mapping, the guard clauses that
// avoid a pointless round trip — and both memoisation layers would interfere:
// unstable_cache needs a Next request context that a unit test has no reason to
// stand up, and cache() would collapse the very call counts being asserted.
export {
  fetchAllProducts,
  fetchProductById,
  fetchSections,
  fetchSectionBySlug,
  fetchProductsInSection,
  fetchLatestProducts,
};

const getDatabaseProducts = cache(cached("all-products", fetchAllProducts));
const getDatabaseProductById = cache(cached("product-by-id", fetchProductById));
const getDatabaseSections = cache(cached("sections", fetchSections));
const getDatabaseSectionBySlug = cache(cached("section-by-slug", fetchSectionBySlug));
const getDatabaseProductsInSection = cache(cached("products-in-section", fetchProductsInSection));

function withMysteryProducts(products: Product[]): Product[] {
  // The old database tier was a single generic placeholder. Keep normal live
  // stock, but let the complete local editorial collection be the one source of
  // truth for mystery cards so no duplicate generic box leaks into the UI.
  return [...products.filter((product) => !product.isMystery), ...MYSTERY_PRODUCTS];
}

function withMysterySections(sections: Section[]): Section[] {
  const bySlug = new Map(sections.map((section) => [section.slug, section]));
  for (const fallback of MYSTERY_SECTIONS) {
    // Prefer admin-managed wording when it exists; only fill missing shells.
    if (!bySlug.has(fallback.slug)) bySlug.set(fallback.slug, fallback);
  }
  return [...bySlug.values()].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
  );
}

export const getAllProducts = cache(async (): Promise<CatalogResult> => {
  const result = await getDatabaseProducts();
  return result.status === "ok"
    ? { status: "ok", products: withMysteryProducts(result.products) }
    : result;
});

export const getProductById = cache(async (id: string): Promise<ProductResult> => {
  const local = getMysteryProduct(id);
  return local ? { status: "ok", product: local } : getDatabaseProductById(id);
});

export const getSections = cache(async (): Promise<SectionsResult> => {
  const result = await getDatabaseSections();
  // The Mystery Boxes navigation remains useful during a catalog outage because
  // every product and route in this collection is local.
  return result.status === "ok"
    ? { status: "ok", sections: withMysterySections(result.sections) }
    : { status: "ok", sections: MYSTERY_SECTIONS };
});

export const getSectionBySlug = cache(async (slug: string): Promise<SectionResult> => {
  const local = getMysterySection(slug);
  return local ? { status: "ok", section: local } : getDatabaseSectionBySlug(slug);
});

export const getProductsInSection = cache(async (slug: string): Promise<CatalogResult> => {
  const local = getMysteryProductsInSection(slug);
  const result = await getDatabaseProductsInSection(slug);

  if (result.status === "unavailable") {
    return local.length > 0 ? { status: "ok", products: local } : result;
  }

  return {
    status: "ok",
    products: [...result.products.filter((product) => !product.isMystery), ...local],
  };
});

export const getLatestProducts = cache(cached("latest-products", fetchLatestProducts));

// Deliberately uncached. This is the liveness probe behind /api/health — a
// cached "yes" from five minutes ago is exactly the answer it must never give.
export async function checkCatalogConnection(): Promise<boolean> {
  try {
    // Sections now power every storefront nav and all /kits/[section] routes.
    // A products-only probe could report healthy while the taxonomy table was
    // inaccessible (for example, because its Data API grant was missing).
    const [products, sections] = await Promise.all([
      supabase.from("products").select("id").limit(1),
      supabase.from("sections").select("id").limit(1),
    ]);
    return !products.error && !sections.error;
  } catch {
    return false;
  }
}
