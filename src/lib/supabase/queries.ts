import { supabase } from "./client";
import type { Product } from "@/lib/types";
import { isUuid } from "@/lib/ids";

const COLUMNS = "id, name, team, price, sizes, image_url, in_stock, description, is_mystery";

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
}

export type CatalogResult =
  | { status: "ok"; products: Product[] }
  | { status: "unavailable"; products: [] };

export type ProductResult =
  | { status: "ok"; product: Product }
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

export async function checkCatalogConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("products").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
