// Pure section helpers — no React, no Supabase, no server-only imports, so both
// the storefront and the admin panel can use them and they stay unit-testable.

export interface Section {
  id: string;
  slug: string;
  label: string;
  navGroup: NavGroup;
  sortOrder: number;
  accent: string | null;
  description: string | null;
  hidden: boolean;
}

// A section's nav group decides how the header renders it, which is code, so the
// set is closed and mirrored by a CHECK constraint in the database. Adding a
// group needs a migration and a deploy; adding a *section* needs neither.
export const NAV_GROUPS = ["featured", "type", "league", "country", "club", "mystery"] as const;
export type NavGroup = (typeof NAV_GROUPS)[number];

export function isNavGroup(value: unknown): value is NavGroup {
  return typeof value === "string" && (NAV_GROUPS as readonly string[]).includes(value);
}

// Every group has a label so admin UIs can name them all. The storefront header
// deliberately ignores the `featured` one — those render as standalone top-level
// links rather than as a labelled dropdown (see groupSections).
export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  featured: "Featured",
  type: "Browse",
  league: "Shop by League",
  country: "Shop by Country",
  club: "Shop by Club",
  mystery: "Mystery",
};

// Lowercase, digits, single hyphens between segments. Enforced here and by a
// CHECK constraint in the database. This is not cosmetic: the slug is both a URL
// path segment and a PostgREST filter value (`sections=cs.{slug}`), so a slug
// containing a comma or brace would silently corrupt the query.
export const SECTION_SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SECTION_SLUG_MAX = 60;

export function isValidSectionSlug(value: unknown): value is string {
  return (
    typeof value === "string" && value.length <= SECTION_SLUG_MAX && SECTION_SLUG_RE.test(value)
  );
}

// Route segments the storefront and admin already own. A section slug that
// collided with one would shadow a real page, so the admin rejects these.
export const RESERVED_SECTION_SLUGS = new Set(["admin", "api", "jersey", "kits", "sitemap", "robots"]);

export function slugify(label: string): string {
  return label
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining marks left by NFKD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SECTION_SLUG_MAX)
    .replace(/-+$/g, "");
}

export const SECTION_ACCENT_RE = /^#[0-9a-f]{6}$/;

export function isValidAccent(value: unknown): value is string {
  return typeof value === "string" && SECTION_ACCENT_RE.test(value);
}

// Falls back to the brand navy so "no accent" is always a valid, on-brand choice.
export function sectionAccent(section: Pick<Section, "accent">): string {
  return section.accent ?? "var(--gz-navy)";
}

export function sectionHref(slug: string): string {
  return `/kits/${slug}`;
}

// Mirrors the database rename fan-out for client state in /admin. Returning the
// original array when nothing changes avoids needless product-card updates.
export function renameSectionMembership(
  slugs: string[],
  oldSlug: string,
  newSlug: string,
): string[] {
  if (oldSlug === newSlug || !slugs.includes(oldSlug)) return slugs;
  return [...new Set(slugs.map((slug) => (slug === oldSlug ? newSlug : slug)))];
}

export interface NavGroupModel {
  group: NavGroup;
  label: string | null; // null for `featured` — rendered as standalone links
  sections: Section[];
}

// Orders sections into the shape the header renders: `featured` first as
// standalone links, then each labelled dropdown in NAV_GROUPS order. Empty
// groups are omitted so the nav never shows a dropdown with nothing in it.
export function groupSections(sections: Section[]): NavGroupModel[] {
  const byOrder = [...sections].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
  );

  return NAV_GROUPS.map((group) => ({
    group,
    label: group === "featured" ? null : NAV_GROUP_LABELS[group],
    sections: byOrder.filter((s) => s.navGroup === group),
  })).filter((g) => g.sections.length > 0);
}
