import { cache } from "react";
import { unstable_cache } from "next/cache";
import { supabase } from "./client";
import type { Product } from "@/lib/types";
import { isUuid } from "@/lib/ids";
import { isValidSectionSlug, type NavGroup, type Section } from "@/lib/sections";
import { CATALOG_TAG } from "@/lib/cache-tags";

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

function cached<Args extends unknown[], Result>(
  key: string,
  fn: (...args: Args) => Promise<Result>,
) {
  return unstable_cache(fn, [key], { revalidate: MAX_AGE_SECONDS, tags: [CATALOG_TAG] });
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

export const getAllProducts = cache(cached("all-products", fetchAllProducts));
export const getProductById = cache(cached("product-by-id", fetchProductById));
export const getSections = cache(cached("sections", fetchSections));
export const getSectionBySlug = cache(cached("section-by-slug", fetchSectionBySlug));
export const getProductsInSection = cache(cached("products-in-section", fetchProductsInSection));
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
