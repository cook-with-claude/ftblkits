import { supabase } from "./client";
import type { Product } from "@/lib/types";
import { isUuid } from "@/lib/ids";

const COLUMNS = "id, name, country, price, sizes, image_url, in_stock, description, is_mystery";

interface ProductRow {
  id: string;
  name: string;
  country: string;
  price: number | string;
  sizes: string[] | null;
  image_url: string | null;
  in_stock: boolean;
  description: string | null;
  is_mystery: boolean | null;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    price: Number(row.price),
    sizes: row.sizes ?? [],
    imageUrl: row.image_url,
    inStock: row.in_stock,
    description: row.description,
    isMystery: row.is_mystery ?? false,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(COLUMNS)
      .eq("hidden", false)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => toProduct(row as ProductRow));
  } catch (err) {
    // Never let a Supabase outage (e.g. a free-tier project auto-paused after
    // inactivity, or a network blip) crash the whole page. Log it and render
    // an empty catalog so the rest of the site stays up.
    console.error("[queries] getAllProducts failed:", err);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isUuid(id)) return null;

  try {
    const { data, error } = await supabase
      .from("products")
      .select(COLUMNS)
      .eq("id", id)
      .eq("hidden", false)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toProduct(data as ProductRow) : null;
  } catch (err) {
    // Same reasoning as getAllProducts: degrade to "not found" (a 404) rather
    // than a 500 if Supabase is unreachable.
    console.error(`[queries] getProductById(${id}) failed:`, err);
    return null;
  }
}
