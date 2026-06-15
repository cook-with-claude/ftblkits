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
  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("hidden", false)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data ?? []).map((row) => toProduct(row as ProductRow));
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isUuid(id)) return null;

  const { data, error } = await supabase
    .from("products")
    .select(COLUMNS)
    .eq("id", id)
    .eq("hidden", false)
    .maybeSingle();
  if (error) throw new Error(`Failed to load product: ${error.message}`);
  return data ? toProduct(data as ProductRow) : null;
}
