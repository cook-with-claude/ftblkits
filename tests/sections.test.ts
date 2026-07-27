import { describe, it, expect } from "vitest";
import {
  isValidSectionSlug,
  slugify,
  groupSections,
  sectionAccent,
  sectionHref,
  isNavGroup,
  isValidAccent,
  NAV_GROUPS,
  RESERVED_SECTION_SLUGS,
  type Section,
} from "@/lib/sections";

function make(overrides: Partial<Section> = {}): Section {
  return {
    id: overrides.id ?? "id",
    slug: overrides.slug ?? "la-liga",
    label: overrides.label ?? "La Liga",
    navGroup: overrides.navGroup ?? "league",
    sortOrder: overrides.sortOrder ?? 0,
    accent: overrides.accent ?? null,
    description: overrides.description ?? null,
    hidden: overrides.hidden ?? false,
  };
}

describe("isValidSectionSlug", () => {
  it("accepts lowercase, hyphen-separated slugs", () => {
    expect(isValidSectionSlug("la-liga")).toBe(true);
    expect(isValidSectionSlug("25-26-kits")).toBe(true);
    expect(isValidSectionSlug("brazil")).toBe(true);
  });

  it("rejects anything that would break a URL or a PostgREST filter", () => {
    for (const bad of [
      "La-Liga", // uppercase
      "la--liga", // doubled separator
      "-la-liga", // leading hyphen
      "la-liga-", // trailing hyphen
      "la_liga", // underscore
      "la liga", // space
      "la,liga", // comma would split a cs.{} filter list
      "{la-liga}", // braces delimit a PostgREST array literal
      "la/liga", // extra path segment
      "",
    ]) {
      expect(isValidSectionSlug(bad), bad).toBe(false);
    }
  });

  it("rejects slugs longer than the column allows", () => {
    expect(isValidSectionSlug("a".repeat(60))).toBe(true);
    expect(isValidSectionSlug("a".repeat(61))).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isValidSectionSlug(null)).toBe(false);
    expect(isValidSectionSlug(42)).toBe(false);
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Premier League")).toBe("premier-league");
  });

  it("collapses runs of punctuation into a single hyphen", () => {
    expect(slugify("25/26 Kits")).toBe("25-26-kits");
    expect(slugify("Serie  A")).toBe("serie-a");
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("  La Liga!  ")).toBe("la-liga");
    expect(slugify("---Retro---")).toBe("retro");
  });

  it("strips diacritics rather than dropping the letter", () => {
    expect(slugify("México")).toBe("mexico");
  });

  it("always produces something isValidSectionSlug accepts, or empty", () => {
    for (const input of ["Premier League", "25/26 Kits", "México", "  A  "]) {
      const slug = slugify(input);
      expect(isValidSectionSlug(slug), `${input} -> ${slug}`).toBe(true);
    }
    // No salvageable characters: caller must handle the empty case.
    expect(slugify("!!!")).toBe("");
  });
});

describe("reserved slugs", () => {
  it("covers the route segments the app already owns", () => {
    for (const reserved of ["admin", "api", "jersey", "kits"]) {
      expect(RESERVED_SECTION_SLUGS.has(reserved)).toBe(true);
    }
  });
});

describe("isNavGroup / isValidAccent", () => {
  it("accepts only the closed nav-group set", () => {
    for (const g of NAV_GROUPS) expect(isNavGroup(g)).toBe(true);
    expect(isNavGroup("tournament")).toBe(false);
    expect(isNavGroup(null)).toBe(false);
  });

  it("accepts only lowercase 6-digit hex accents", () => {
    expect(isValidAccent("#1e2a78")).toBe(true);
    expect(isValidAccent("#1E2A78")).toBe(false);
    expect(isValidAccent("#fff")).toBe(false);
    expect(isValidAccent("red")).toBe(false);
    expect(isValidAccent(null)).toBe(false);
  });
});

describe("sectionAccent / sectionHref", () => {
  it("falls back to the brand navy when no accent is set", () => {
    expect(sectionAccent(make({ accent: null }))).toBe("var(--gz-navy)");
    expect(sectionAccent(make({ accent: "#ec1e5c" }))).toBe("#ec1e5c");
  });

  it("builds the section route", () => {
    expect(sectionHref("la-liga")).toBe("/kits/la-liga");
  });
});

describe("groupSections", () => {
  const sections = [
    make({ id: "1", slug: "world-cup-2026", label: "World Cup 2026", navGroup: "featured", sortOrder: 10 }),
    make({ id: "2", slug: "retro-kits", label: "Retro Kits", navGroup: "featured", sortOrder: 30 }),
    make({ id: "3", slug: "la-liga", label: "La Liga", navGroup: "league", sortOrder: 20 }),
    make({ id: "4", slug: "premier-league", label: "Premier League", navGroup: "league", sortOrder: 10 }),
    make({ id: "5", slug: "brazil", label: "Brazil", navGroup: "country", sortOrder: 10 }),
  ];

  it("orders groups the way the nav renders them, featured first", () => {
    expect(groupSections(sections).map((g) => g.group)).toEqual(["featured", "league", "country"]);
  });

  it("orders sections within a group by sortOrder", () => {
    const league = groupSections(sections).find((g) => g.group === "league");
    expect(league?.sections.map((s) => s.slug)).toEqual(["premier-league", "la-liga"]);
  });

  it("falls back to label order when sortOrder ties", () => {
    const tied = [
      make({ id: "a", slug: "spain", label: "Spain", navGroup: "country", sortOrder: 5 }),
      make({ id: "b", slug: "brazil", label: "Brazil", navGroup: "country", sortOrder: 5 }),
    ];
    expect(groupSections(tied)[0].sections.map((s) => s.slug)).toEqual(["brazil", "spain"]);
  });

  it("labels dropdown groups but leaves featured unlabelled", () => {
    const grouped = groupSections(sections);
    expect(grouped.find((g) => g.group === "featured")?.label).toBeNull();
    expect(grouped.find((g) => g.group === "league")?.label).toBe("Shop by League");
  });

  it("omits empty groups so the nav never shows an empty dropdown", () => {
    expect(groupSections(sections).some((g) => g.group === "club")).toBe(false);
    expect(groupSections([])).toEqual([]);
  });

  it("does not mutate the input", () => {
    const input = [...sections];
    groupSections(input);
    expect(input.map((s) => s.id)).toEqual(sections.map((s) => s.id));
  });
});
