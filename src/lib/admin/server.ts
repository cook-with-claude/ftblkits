import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "./auth";
import { SITE_URL } from "@/lib/config";
import type { AdminProduct } from "./types";
import { PRODUCT_LIMITS } from "./validation";
export { PRODUCT_LIMITS } from "./validation";

// Returns a 401 response if the request lacks a valid admin session, else null.
export function requireAdmin(req: NextRequest): NextResponse | null {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// The set of origins an admin mutation may legitimately come from. Behind a
// proxy (Netlify) `req.nextUrl.origin` is an internal address that never
// matches the browser's Origin, so we trust the host the browser actually
// addressed (forwarded by the proxy) plus the configured canonical site URL.
function trustedOrigins(req: NextRequest): Set<string> {
  const allowed = new Set<string>();
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  if (host) {
    const proto =
      req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      req.nextUrl.protocol.replace(":", "") ||
      "https";
    allowed.add(`${proto}://${host}`);
  }
  try {
    allowed.add(new URL(SITE_URL).origin);
  } catch {
    // SITE_URL normalizes to a safe default, so this should not throw.
  }
  return allowed;
}

export function requireSameOrigin(req: NextRequest): NextResponse | null {
  const originHeader = req.headers.get("origin");
  const forbidden = () => NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!originHeader) return forbidden();

  let origin: string;
  try {
    origin = new URL(originHeader).origin;
  } catch {
    return forbidden();
  }

  return trustedOrigins(req).has(origin) ? null : forbidden();
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
  const seen = new Set<string>();
  return parts
    .map((s) => String(s).trim())
    .filter((s) => {
      if (!s || s.length > PRODUCT_LIMITS.size) return false;
      const key = s.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function isAllowedProductImageUrl(value: string): boolean {
  try {
    const image = new URL(value);
    const project = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return (
      image.protocol === "https:" &&
      image.origin === project.origin &&
      image.pathname.startsWith("/storage/v1/object/public/kits/")
    );
  } catch {
    return false;
  }
}

export function validatePublishableProduct(row: Record<string, unknown>): string | null {
  if (row.hidden !== false) return null;
  if (!Array.isArray(row.sizes) || row.sizes.length === 0) {
    return "Add at least one size before showing this kit in the shop";
  }
  // Mystery kits are intentionally shown without a product photo (rendered via
  // MysteryVisual, not image_url), so don't require one. Mirrors the
  // products_visible_listing_complete database constraint. Without this,
  // any edit to a visible mystery kit would be rejected here.
  if (row.is_mystery === true) return null;
  if (typeof row.image_url !== "string" || !isAllowedProductImageUrl(row.image_url)) {
    return "Upload a valid kit photo before showing this kit in the shop";
  }
  return null;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
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
    if (name.length > PRODUCT_LIMITS.name) {
      return { ok: false, error: `Name must be ${PRODUCT_LIMITS.name} characters or fewer` };
    }
    row.name = name;
  }
  if (has("country")) {
    const country = String(b.country ?? "").trim();
    if (!country) return { ok: false, error: "Country is required" };
    if (country.length > PRODUCT_LIMITS.country) {
      return { ok: false, error: `Country must be ${PRODUCT_LIMITS.country} characters or fewer` };
    }
    row.country = country;
  }
  if (has("price")) {
    if (typeof b.price === "string" && b.price.trim() === "") {
      return { ok: false, error: "Price must be a number ≥ 0" };
    }
    const price = Number(b.price);
    if (!Number.isFinite(price) || price < 0 || price > PRODUCT_LIMITS.price) {
      return { ok: false, error: `Price must be between 0 and ${PRODUCT_LIMITS.price}` };
    }
    if (Math.abs(price * 100 - Math.round(price * 100)) > Number.EPSILON * 100) {
      return { ok: false, error: "Price can have at most 2 decimal places" };
    }
    row.price = price;
  }
  if (has("sizes")) {
    const rawParts = Array.isArray(b.sizes)
      ? b.sizes
      : typeof b.sizes === "string"
        ? b.sizes.split(",")
        : [];
    if (rawParts.some((s) => String(s).trim().length > PRODUCT_LIMITS.size)) {
      return { ok: false, error: `Each size must be ${PRODUCT_LIMITS.size} characters or fewer` };
    }
    const sizes = coerceSizes(b.sizes);
    if (sizes.length > PRODUCT_LIMITS.sizes) {
      return { ok: false, error: `Use no more than ${PRODUCT_LIMITS.sizes} sizes` };
    }
    row.sizes = sizes;
  }
  if (has("description")) {
    const d = b.description;
    const description = d == null ? "" : String(d).trim();
    if (description.length > PRODUCT_LIMITS.description) {
      return {
        ok: false,
        error: `Description must be ${PRODUCT_LIMITS.description} characters or fewer`,
      };
    }
    row.description = description || null;
  }
  if (has("imageUrl")) {
    const u = b.imageUrl;
    const imageUrl = u == null ? "" : String(u).trim();
    if (imageUrl && !isAllowedProductImageUrl(imageUrl)) {
      return { ok: false, error: "Photo must come from the configured kits storage bucket" };
    }
    row.image_url = imageUrl || null;
  }
  if (has("inStock")) {
    const parsed = parseBoolean(b.inStock);
    if (parsed === null) return { ok: false, error: "In-stock must be true or false" };
    row.in_stock = parsed;
  }
  if (has("hidden")) {
    const parsed = parseBoolean(b.hidden);
    if (parsed === null) return { ok: false, error: "Hidden must be true or false" };
    row.hidden = parsed;
  }
  if (has("isMystery")) {
    const parsed = parseBoolean(b.isMystery);
    if (parsed === null) return { ok: false, error: "Mystery kit must be true or false" };
    row.is_mystery = parsed;
  }

  if (!partial) {
    if (row.name === undefined) return { ok: false, error: "Name is required" };
    if (row.country === undefined) return { ok: false, error: "Country is required" };
    if (row.price === undefined) return { ok: false, error: "Price is required" };
    if (row.sizes === undefined) row.sizes = [];
    if (row.image_url === undefined) row.image_url = null;
    if (row.in_stock === undefined) row.in_stock = true;
    if (row.hidden === undefined) row.hidden = false;
    if (row.is_mystery === undefined) row.is_mystery = false;
  }

  if (Object.keys(row).length === 0) return { ok: false, error: "Nothing to update" };
  if (!partial) {
    const publishError = validatePublishableProduct(row);
    if (publishError) return { ok: false, error: publishError };
  }
  return { ok: true, row };
}
