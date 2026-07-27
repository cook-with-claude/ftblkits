import type { AdminProduct, AdminSection } from "@/lib/admin/types";

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
  team: string;
  price: number;
  sizes: string[];
  description: string | null;
  imageUrl: string | null;
  inStock: boolean;
  hidden: boolean;
  isMystery: boolean;
  sections: string[];
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

export interface SectionInput {
  slug: string;
  label: string;
  navGroup: string;
  sortOrder: number;
  accent: string | null;
  description: string | null;
  hidden: boolean;
}

export async function fetchSections(): Promise<AdminSection[]> {
  const res = await fetch("/api/admin/sections", { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()).sections;
}

export async function createSection(input: SectionInput): Promise<AdminSection> {
  const res = await fetch("/api/admin/sections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()).section;
}

export async function updateSection(
  id: string,
  input: Partial<SectionInput>,
): Promise<AdminSection> {
  const res = await fetch(`/api/admin/sections/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()).section;
}

export async function deleteSection(id: string): Promise<void> {
  const res = await fetch(`/api/admin/sections/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await readError(res));
}

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()).url;
}

export async function discardUploadedImage(url: string): Promise<void> {
  const res = await fetch("/api/admin/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(await readError(res));
}
