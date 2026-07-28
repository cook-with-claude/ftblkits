import { revalidateTag } from "next/cache";

/**
 * Everything the storefront reads out of Supabase sits behind this one tag.
 *
 * Products and sections are not independent — renaming a section slug rewrites
 * every product that references it, and deleting one strips the slug from all of
 * them. Splitting the tag would mean remembering to purge both halves on exactly
 * those operations, so a single tag is both simpler and harder to get wrong.
 */
export const CATALOG_TAG = "catalog";

/**
 * Drops the cached catalog after an admin write, so an edit is visible on the
 * storefront on the very next request rather than whenever the TTL lapses.
 *
 * The "max" profile is required in Next 16 — the one-argument form is deprecated
 * and warns. `updateTag` is not an option here: it throws outside Server
 * Actions, and these callers are all route handlers.
 */
export function purgeCatalog() {
  revalidateTag(CATALOG_TAG, "max");
}
