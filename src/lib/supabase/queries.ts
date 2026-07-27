import { supabase } from "./client";
import type { Product } from "@/lib/types";
import { isUuid } from "@/lib/ids";
import { isValidSectionSlug, type NavGroup, type Section } from "@/lib/sections";

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

export async function getAllProducts(): Promise<CatalogResult> {
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

export async function getProductById(id: string): Promise<ProductResult> {
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
export async function getSections(): Promise<SectionsResult> {
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

export async function getSectionBySlug(slug: string): Promise<SectionResult> {
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
export async function getProductsInSection(slug: string): Promise<CatalogResult> {
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
export async function getLatestProducts(limit = 10): Promise<CatalogResult> {
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

export async function checkCatalogConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("products").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
