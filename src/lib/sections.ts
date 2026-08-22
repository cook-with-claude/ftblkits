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
  mystery: "Mystery Boxes",
};

// What the storefront header renders. The long forms above read better in
// /admin, where a settings row has all the width it wants; across a nav bar
// that also carries nine top-level items they were the single biggest reason
// the row could not fit on one line at any viewport width.
export const NAV_GROUP_SHORT_LABELS: Record<NavGroup, string> = {
  featured: "Featured",
  type: "Browse",
  league: "Leagues",
  country: "Countries",
  club: "Clubs",
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

// The footer's Shop column. Deliberately not "the first N by sortOrder": that
// number is only unique *within* a nav group — five sections share sortOrder 10
// — so a global sort put whichever of them won the tiebreak into the footer.
// That is how a single country, Argentina, ended up listed beside National
// Teams and Champions League while Brazil and England did not.
//
// The column shows top-level destinations only. Countries, leagues and clubs
// are long lists the header dropdowns already own, and surfacing one arbitrary
// member of a list reads as an editorial pick that nobody made.
const FOOTER_GROUP_RANK: Partial<Record<NavGroup, number>> = {
  featured: 0,
  type: 1,
  mystery: 2,
};

// The mystery group holds one umbrella section plus four per-category boxes;
// only the umbrella belongs in a shortcut list.
const MYSTERY_UMBRELLA_SLUG = "mystery-boxes";

export const FOOTER_SHORTCUT_LIMIT = 7;

export function footerShortcuts(
  sections: Section[],
  limit: number = FOOTER_SHORTCUT_LIMIT,
): Section[] {
  return sections
    .filter((s) => {
      const rank = FOOTER_GROUP_RANK[s.navGroup];
      if (rank === undefined) return false;
      return s.navGroup !== "mystery" || s.slug === MYSTERY_UMBRELLA_SLUG;
    })
    .sort(
      (a, b) =>
        FOOTER_GROUP_RANK[a.navGroup]! - FOOTER_GROUP_RANK[b.navGroup]! ||
        a.sortOrder - b.sortOrder ||
        a.label.localeCompare(b.label),
    )
    .slice(0, limit);
}
