import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "./auth";
import type { AdminProduct } from "./types";

// Returns a 401 response if the request lacks a valid admin session, else null.
export function requireAdmin(req: NextRequest): NextResponse | null {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export const ADMIN_COLUMNS =
  "id, name, country, price, sizes, image_url, in_stock, hidden, is_mystery, description";

interface Row {
  id: string;
  name: string;
  country: string;
  price: number | string;
  sizes: string[] | null;
  image_url: string | null;
  in_stock: boolean;
  hidden: boolean;
  is_mystery: boolean | null;
  description: string | null;
}

export function toAdminProduct(row: Row): AdminProduct {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    price: Number(row.price),
    sizes: row.sizes ?? [],
    imageUrl: row.image_url,
    inStock: row.in_stock,
    hidden: row.hidden,
    isMystery: row.is_mystery ?? false,
    description: row.description,
  };
}

function coerceSizes(v: unknown): string[] {
  const parts = Array.isArray(v)
    ? v
    : typeof v === "string"
      ? v.split(",")
      : [];
  return parts
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0);
}

// Maps a JSON body to a DB-column object. `partial` (PATCH) only includes
// provided keys; create (POST) requires name/country/price.
export function parseProductBody(
  body: unknown,
  { partial }: { partial: boolean },
): { ok: true; row: Record<string, unknown> } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid body" };
  }
  const b = body as Record<string, unknown>;
  const row: Record<string, unknown> = {};

  const has = (k: string) => Object.prototype.hasOwnProperty.call(b, k);

  if (has("name")) {
    const name = String(b.name ?? "").trim();
    if (!name) return { ok: false, error: "Name is required" };
    row.name = name;
  }
  if (has("country")) {
    const country = String(b.country ?? "").trim();
    if (!country) return { ok: false, error: "Country is required" };
    row.country = country;
  }
  if (has("price")) {
    const price = Number(b.price);
    if (!Number.isFinite(price) || price < 0) {
      return { ok: false, error: "Price must be a number ≥ 0" };
    }
    row.price = price;
  }
  if (has("sizes")) row.sizes = coerceSizes(b.sizes);
  if (has("description")) {
    const d = b.description;
    row.description = d == null || String(d).trim() === "" ? null : String(d).trim();
  }
  if (has("imageUrl")) {
    const u = b.imageUrl;
    row.image_url = u == null || String(u).trim() === "" ? null : String(u).trim();
  }
  if (has("inStock")) row.in_stock = Boolean(b.inStock);
  if (has("hidden")) row.hidden = Boolean(b.hidden);
  if (has("isMystery")) row.is_mystery = Boolean(b.isMystery);

  if (!partial) {
    if (row.name === undefined) return { ok: false, error: "Name is required" };
    if (row.country === undefined) return { ok: false, error: "Country is required" };
    if (row.price === undefined) return { ok: false, error: "Price is required" };
    if (row.sizes === undefined) row.sizes = [];
    if (row.in_stock === undefined) row.in_stock = true;
    if (row.hidden === undefined) row.hidden = false;
    if (row.is_mystery === undefined) row.is_mystery = false;
  }

  if (Object.keys(row).length === 0) return { ok: false, error: "Nothing to update" };
  return { ok: true, row };
}
