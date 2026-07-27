import type { AdminSection } from "./types";
import { SECTION_LIMITS } from "./validation";
import { asRecord, hasKey, parseBoolean } from "./parse";
import { isNavGroup, isValidAccent, isValidSectionSlug, RESERVED_SECTION_SLUGS } from "@/lib/sections";

export const SECTION_COLUMNS =
  "id, slug, label, nav_group, sort_order, accent, description, hidden";

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

export function toAdminSection(row: SectionRow): AdminSection {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    navGroup: row.nav_group,
    sortOrder: row.sort_order,
    accent: row.accent,
    description: row.description,
    hidden: row.hidden,
  };
}

// `products.sections` is an array of slugs with no foreign key, so the route
// checks membership itself before writing. Returns an error message naming the
// offending slugs, or null when every slug exists.
export async function unknownSectionsError(
  // Loosely typed on purpose: threading the Supabase client's generics through
  // here makes the inference in the calling route blow its depth limit.
  supabase: { from: (table: string) => unknown },
  slugs: unknown,
): Promise<string | null> {
  if (!Array.isArray(slugs) || slugs.length === 0) return null;

  const query = supabase.from("sections") as unknown as {
    select: (columns: string) => {
      in: (
        column: string,
        values: string[],
      ) => PromiseLike<{ data: { slug: string }[] | null; error: unknown }>;
    };
  };
  const { data, error } = await query.select("slug").in("slug", slugs as string[]);
  if (error) return "Could not verify sections";

  const known = new Set((data ?? []).map((row) => row.slug));
  const missing = (slugs as string[]).filter((slug) => !known.has(slug));
  if (missing.length === 0) return null;
  return `Unknown section${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`;
}

// Mirrors parseProductBody: camelCase in, snake_case out, presence-checked keys,
// and a defaults block for creates.
export function parseSectionBody(
  body: unknown,
  { partial }: { partial: boolean },
): { ok: true; row: Record<string, unknown> } | { ok: false; error: string } {
  const b = asRecord(body);
  if (!b) return { ok: false, error: "Invalid body" };

  const row: Record<string, unknown> = {};
  const has = (k: string) => hasKey(b, k);

  if (has("slug")) {
    const slug = String(b.slug ?? "").trim().toLowerCase();
    if (!slug) return { ok: false, error: "URL slug is required" };
    if (slug.length > SECTION_LIMITS.slug) {
      return { ok: false, error: `URL slug must be ${SECTION_LIMITS.slug} characters or fewer` };
    }
    if (!isValidSectionSlug(slug)) {
      return {
        ok: false,
        error: "URL slug can only use lowercase letters, numbers and single hyphens",
      };
    }
    // A section called "admin" or "jersey" would shadow a real route.
    if (RESERVED_SECTION_SLUGS.has(slug)) {
      return { ok: false, error: `"${slug}" is reserved — pick a different URL slug` };
    }
    row.slug = slug;
  }

  if (has("label")) {
    const label = String(b.label ?? "").trim();
    if (!label) return { ok: false, error: "Name is required" };
    if (label.length > SECTION_LIMITS.label) {
      return { ok: false, error: `Name must be ${SECTION_LIMITS.label} characters or fewer` };
    }
    row.label = label;
  }

  if (has("navGroup")) {
    const navGroup = String(b.navGroup ?? "").trim();
    if (!isNavGroup(navGroup)) return { ok: false, error: "Pick a valid menu group" };
    row.nav_group = navGroup;
  }

  if (has("sortOrder")) {
    const sortOrder = Number(b.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10_000) {
      return { ok: false, error: "Order must be a whole number between 0 and 10000" };
    }
    row.sort_order = sortOrder;
  }

  if (has("accent")) {
    const raw = b.accent;
    const accent = raw == null ? "" : String(raw).trim().toLowerCase();
    if (accent && !isValidAccent(accent)) {
      return { ok: false, error: "Accent must be a hex colour like #1e2a78" };
    }
    row.accent = accent || null;
  }

  if (has("description")) {
    const raw = b.description;
    const description = raw == null ? "" : String(raw).trim();
    if (description.length > SECTION_LIMITS.description) {
      return {
        ok: false,
        error: `Description must be ${SECTION_LIMITS.description} characters or fewer`,
      };
    }
    row.description = description || null;
  }

  if (has("hidden")) {
    const parsed = parseBoolean(b.hidden);
    if (parsed === null) return { ok: false, error: "Hidden must be true or false" };
    row.hidden = parsed;
  }

  if (!partial) {
    if (row.slug === undefined) return { ok: false, error: "URL slug is required" };
    if (row.label === undefined) return { ok: false, error: "Name is required" };
    if (row.nav_group === undefined) row.nav_group = "featured";
    if (row.sort_order === undefined) row.sort_order = 0;
    if (row.accent === undefined) row.accent = null;
    if (row.description === undefined) row.description = null;
    if (row.hidden === undefined) row.hidden = false;
  }

  if (Object.keys(row).length === 0) return { ok: false, error: "Nothing to update" };
  return { ok: true, row };
}
