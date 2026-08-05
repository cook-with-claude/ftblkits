import { describe, it, expect } from "vitest";
// @ts-expect-error -- plain .mjs module shared with the retro scripts
import {
  FOUNDED,
  NATIONAL_ALIASES,
  NATIONAL_TEAMS,
  RETRO_LATEST_START_YEAR,
  RETRO_PRICE,
  RETRO_SECTION,
  isPlausibleEra,
  normaliseSeason,
  retroKitName,
  retroKitSlug,
  retroSections,
} from "../scripts/retro-data.mjs";

describe("normaliseSeason", () => {
  it("folds the supplier's several ways of writing one season", () => {
    // These are the same shirt and must not become two listings.
    expect(normaliseSeason("97-98").label).toBe("1997/98");
    expect(normaliseSeason("1997-98").label).toBe("1997/98");
    expect(normaliseSeason("1997-1998").label).toBe("1997/98");
  });

  it("reads two-digit years across the century boundary", () => {
    expect(normaliseSeason("95-96")).toEqual({ label: "1995/96", startYear: 1995 });
    expect(normaliseSeason("02-03")).toEqual({ label: "2002/03", startYear: 2002 });
    expect(normaliseSeason("13-14")).toEqual({ label: "2013/14", startYear: 2013 });
  });

  it("handles a single-year season", () => {
    expect(normaliseSeason("1994")).toEqual({ label: "1994", startYear: 1994 });
  });

  it("spans a decade boundary correctly", () => {
    expect(normaliseSeason("1999-00").label).toBe("1999/00");
    expect(normaliseSeason("2009-10").label).toBe("2009/10");
  });

  it("returns null for anything it cannot read", () => {
    expect(normaliseSeason("banana")).toBeNull();
    expect(normaliseSeason("")).toBeNull();
  });
});

describe("retro naming", () => {
  it("builds a readable name and a slashless slug", () => {
    expect(retroKitName("Napoli", "1997/98", "Home")).toBe("Napoli 1997/98 Home");
    expect(retroKitSlug("Napoli", "1997/98", "Home")).toBe("napoli-1997-98-home-retro");
  });

  it("cannot collide with a current-season kit for the same club", () => {
    // The -retro suffix is what guarantees this: without it a 2026/27 slug and a
    // retro slug for the same club and variant could land on the same file.
    expect(retroKitSlug("Arsenal", "2026/27", "Home")).not.toBe("arsenal-26-27-home");
    expect(retroKitSlug("Arsenal", "2026/27", "Home")).toMatch(/-retro$/);
  });

  it("folds accents in the team name", () => {
    expect(retroKitSlug("Atlético Madrid", "1995/96", "Home")).toBe("atletico-madrid-1995-96-home-retro");
  });
});

describe("retroSections", () => {
  it("puts club shirts in retro-kits and club-kits", () => {
    expect(retroSections("Napoli", { isNational: false })).toEqual([RETRO_SECTION, "club-kits"]);
  });

  it("puts national shirts in national-teams, plus a country section when one exists", () => {
    expect(retroSections("Brazil", { isNational: true })).toEqual([RETRO_SECTION, "national-teams", "brazil"]);
  });

  it("omits the country section for a country the storefront has no page for", () => {
    expect(retroSections("Japan", { isNational: true })).toEqual([RETRO_SECTION, "national-teams"]);
  });

  it("never exceeds the twelve-section cap the database enforces", () => {
    for (const team of Object.keys(NATIONAL_TEAMS)) {
      expect(retroSections(team, { isNational: true }).length).toBeLessThanOrEqual(12);
    }
  });
});

describe("isPlausibleEra", () => {
  it("rejects a shirt older than the club that supposedly wore it", () => {
    // The supplier titled an Inter Milan shirt "94-95 Inter Miami"; Inter Miami
    // was founded in 2018.
    expect(isPlausibleEra("Inter Miami", 1994)).toBe(false);
    expect(isPlausibleEra("Inter Miami", 2020)).toBe(true);
  });

  it("waves through any club with no founding year recorded", () => {
    expect(isPlausibleEra("Napoli", 1926)).toBe(true);
  });

  it("only lists clubs young enough for the check to matter", () => {
    for (const year of Object.values(FOUNDED)) expect(year).toBeGreaterThan(2000);
  });
});

describe("retro constants", () => {
  it("prices retro above a current-season replica", () => {
    expect(RETRO_PRICE).toBeGreaterThan(29.99);
  });

  it("does not treat recent seasons as retro", () => {
    // There are albums titled "25-26 Arsenal Retro"; last season's shirt is not
    // a retro shirt whatever the supplier calls it.
    expect(RETRO_LATEST_START_YEAR).toBeLessThan(2020);
  });

  it("does not map 'america' to the USA", () => {
    // In this supplier's titles "America" means Club América, the Mexican club.
    expect(NATIONAL_ALIASES).not.toHaveProperty("america");
    expect(NATIONAL_ALIASES.usa).toBe("United States");
  });

  it("points every national alias at a known team", () => {
    for (const target of Object.values(NATIONAL_ALIASES)) {
      expect(NATIONAL_TEAMS).toHaveProperty(target as string);
    }
  });
});
