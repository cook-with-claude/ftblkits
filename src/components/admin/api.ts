import type { AdminProduct } from "@/lib/admin/types";

async function readError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return (data as { error?: string }).error ?? `Request failed (${res.status})`;
}

export async function fetchProducts(): Promise<AdminProduct[]> {
  const res = await fetch("/api/admin/products", { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()).products;
}

export interface ProductInput {
  name: string;
  country: string;
  price: number;
  sizes: string[];
  description: string | null;
  imageUrl: string | null;
  inStock: boolean;
  hidden: boolean;
  isMystery: boolean;
}

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  const res = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()).product;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<AdminProduct> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()).product;
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await readError(res));
}

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()).url;
}
