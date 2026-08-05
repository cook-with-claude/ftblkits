import { describe, it, expect } from "vitest";
// @ts-expect-error -- plain .mjs data module shared with the seed/import scripts
import {
  buildCatalog,
  kitName,
  kitSlug,
  slugify,
  KIT_VARIANTS,
  LEAGUES,
  SEASON_LABEL,
  SEASON_SECTION,
  SEASON_SLUG,
} from "../scripts/catalog-data.mjs";

describe("season identity", () => {
  it("keeps the three season constants in agreement", () => {
    // A blurb saying one season while its section says another is a
    // misdescription, not a cosmetic slip -- so these must never drift.
    expect(SEASON_SECTION).toBe(`${SEASON_SLUG}-kits`);
    expect(SEASON_LABEL).toBe(SEASON_SLUG.replace("-", "/"));
  });

  it("puts the season in both the name and the slug", () => {
    expect(kitName("Arsenal", "Home")).toBe("Arsenal 26/27 Home");
    expect(kitSlug("Arsenal", "Home")).toBe("arsenal-26-27-home");
  });

  it("does not collide with the 25/26 kit it sits beside", () => {
    // The seeder is idempotent on (team, name) and the image importer uploads
    // to <slug>.jpg with upsert:true. A shared name would skip every insert; a
    // shared slug would overwrite the live 25/26 photo.
    expect(kitName("Arsenal", "Home")).not.toBe("Arsenal Home");
    expect(kitSlug("Arsenal", "Home")).not.toBe("arsenal-home");
  });

  it("tags every kit into the season section", () => {
    const catalog = buildCatalog();
    expect(catalog.every((k: { sections: string[] }) => k.sections.includes(SEASON_SECTION))).toBe(true);
  });
});

describe("buildCatalog", () => {
  const catalog = buildCatalog();

  it("covers every club in every league, once per variant", () => {
    const clubs = LEAGUES.reduce((n: number, l: { clubs: string[] }) => n + l.clubs.length, 0);
    expect(catalog).toHaveLength(clubs * KIT_VARIANTS.length);
  });

  it("gives every kit a unique name and a unique slug", () => {
    expect(new Set(catalog.map((k: { name: string }) => k.name)).size).toBe(catalog.length);
    expect(new Set(catalog.map((k: { slug: string }) => k.slug)).size).toBe(catalog.length);
  });

  it("exposes the variant so the seeder need not slice it off the name", () => {
    // describe() used to derive the variant as name.slice(team.length + 1),
    // which now yields "26/27 Home" and produced "Arsenal 26/27 26/27 home".
    const arsenal = catalog.find((k: { name: string }) => k.name === "Arsenal 26/27 Home");
    expect(arsenal.variant).toBe("Home");
    expect(`${arsenal.team} ${SEASON_LABEL} ${arsenal.variant.toLowerCase()} replica shirt.`).toBe(
      "Arsenal 26/27 home replica shirt.",
    );
  });

  it("keeps team free of the season so filters and chips still group by club", () => {
    expect(catalog.every((k: { team: string }) => !k.team.includes(SEASON_LABEL))).toBe(true);
  });
});

describe("slugify", () => {
  it("folds accents rather than dropping them", () => {
    expect(slugify("Alavés")).toBe("alaves");
    expect(slugify("Borussia Mönchengladbach")).toBe("borussia-monchengladbach");
  });

  it("closes up dots and spreads ampersands", () => {
    expect(slugify("D.C. United")).toBe("dc-united");
    expect(slugify("Brighton & Hove Albion")).toBe("brighton-hove-albion");
  });
});
