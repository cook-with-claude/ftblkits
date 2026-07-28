import type { AdminProduct, AdminSection } from "@/lib/admin/types";
import { begin } from "@/lib/pending";

// Image uploads pass through a lambda that buffers the whole file, so they are
// the slowest thing in the app by a wide margin. Everything else is a couple of
// database round trips.
const TIMEOUT_MS = 30_000;

async function readError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return (data as { error?: string }).error ?? `Request failed (${res.status})`;
}

/**
 * Single entry point for every admin request.
 *
 * Two things every call needs and none of them had:
 *  - a pending slot, so the top progress bar and the tab spinner cover admin
 *    work as well as navigation;
 *  - a timeout, so a request made on a dead connection fails with a message
 *    instead of hanging until the user gives up.
 */
async function request(input: string, init?: RequestInit): Promise<Response> {
  const end = begin();
  try {
    return await fetch(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    // A timeout surfaces as TimeoutError, an offline device as TypeError.
    // Neither says anything useful to a shop owner on their own.
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new Error("The server took too long to respond — check your connection and try again.");
    }
    throw new Error("Could not reach the server — check your connection and try again.");
  } finally {
    end();
  }
}

export async function fetchProducts(): Promise<AdminProduct[]> {
  const res = await request("/api/admin/products", { cache: "no-store" });
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
  const res = await request("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()).product;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<AdminProduct> {
  const res = await request(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()).product;
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await request(`/api/admin/products/${id}`, { method: "DELETE" });
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
  const res = await request("/api/admin/sections", { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()).sections;
}

export async function createSection(input: SectionInput): Promise<AdminSection> {
  const res = await request("/api/admin/sections", {
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
  const res = await request(`/api/admin/sections/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()).section;
}

export async function deleteSection(id: string): Promise<void> {
  const res = await request(`/api/admin/sections/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await readError(res));
}

export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await request("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()).url;
}

export async function discardUploadedImage(url: string): Promise<void> {
  const res = await request("/api/admin/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(await readError(res));
}
