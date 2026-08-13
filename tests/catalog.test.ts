import { describe, it, expect } from "vitest";
import {
  isSoldOut,
  isRetro,
  hasBothEras,
  filterProducts,
  sortProducts,
  listTeams,
  mysteryKits,
  regularKits,
  shuffleCatalog,
  buildCatalogFilterUrl,
} from "@/lib/catalog";
import { isUuid } from "@/lib/ids";
import type { Product } from "@/lib/types";

function make(overrides: Partial<Product> = {}): Product {
  return {
    id: overrides.id ?? "id",
    name: overrides.name ?? "Argentina Home",
    team: overrides.team ?? "Argentina",
    price: overrides.price ?? 28,
    sizes: overrides.sizes ?? ["S", "M", "L"],
    imageUrl: overrides.imageUrl ?? null,
    inStock: overrides.inStock ?? true,
    description: overrides.description ?? null,
    isMystery: overrides.isMystery ?? false,
    sections: overrides.sections ?? [],
  };
}

describe("isSoldOut", () => {
  it("is true when the product is not in stock", () => {
    expect(isSoldOut(make({ inStock: false }))).toBe(true);
  });
  it("is false when the product is in stock", () => {
    expect(isSoldOut(make({ inStock: true }))).toBe(false);
  });
});

describe("filterProducts", () => {
  const list = [
    make({ id: "arg", name: "Argentina Home", team: "Argentina" }),
    make({ id: "fra", name: "France Away", team: "France" }),
  ];
  it("returns all when query is empty", () => {
    expect(filterProducts(list, { query: "" }).length).toBe(2);
  });
  it("matches the name case-insensitively", () => {
    expect(filterProducts(list, { query: "argent" }).map((p) => p.id)).toEqual(["arg"]);
  });
  it("matches the team", () => {
    expect(filterProducts(list, { query: "france" }).map((p) => p.id)).toEqual(["fra"]);
  });
  it("filters by team when provided", () => {
    expect(filterProducts(list, { query: "", team: "France" }).map((p) => p.id)).toEqual(["fra"]);
  });
  it("hides sold-out products when inStockOnly is set", () => {
    const withSoldOut = [...list, make({ id: "bra", team: "Brazil", inStock: false })];
    expect(filterProducts(withSoldOut, { query: "", inStockOnly: true }).map((p) => p.id)).toEqual([
      "arg",
      "fra",
    ]);
  });
  it("combines query and team filters", () => {
    const more = [...list, make({ id: "arg2", name: "Argentina Away", team: "Argentina" })];
    expect(
      filterProducts(more, { query: "away", team: "Argentina" }).map((p) => p.id),
    ).toEqual(["arg2"]);
  });
});

describe("era", () => {
  const modern = make({ id: "now", name: "Arsenal 25/26 Home", sections: ["premier-league"] });
  const retro = make({
    id: "old",
    name: "Arsenal 89/90 Home",
    sections: ["premier-league", "retro-kits"],
  });

  it("reads retro membership off the sections already on the record", () => {
    expect(isRetro(retro)).toBe(true);
    expect(isRetro(modern)).toBe(false);
  });

  it("filters to one era at a time and lets 'all' through", () => {
    const list = [modern, retro];
    expect(filterProducts(list, { query: "", era: "retro" }).map((p) => p.id)).toEqual(["old"]);
    expect(filterProducts(list, { query: "", era: "current" }).map((p) => p.id)).toEqual(["now"]);
    expect(filterProducts(list, { query: "", era: "all" }).length).toBe(2);
  });

  it("defaults to showing both when no era is given", () => {
    expect(filterProducts([modern, retro], { query: "" }).length).toBe(2);
  });

  // The chips are noise on a list that is entirely one era, which is every
  // section page except the leagues once the retro shirts are tagged in.
  it("only reports both eras when the list actually straddles them", () => {
    expect(hasBothEras([modern, retro])).toBe(true);
    expect(hasBothEras([retro, retro])).toBe(false);
    expect(hasBothEras([modern])).toBe(false);
    expect(hasBothEras([])).toBe(false);
  });
});

describe("buildCatalogFilterUrl", () => {
  it("updates filters while preserving unrelated params and the fragment", () => {
    expect(
      buildCatalogFilterUrl(
        { pathname: "/kits", search: "?campaign=summer&q=old", hash: "#results" },
        { query: "Real Madrid", team: "Real Madrid", inStockOnly: true },
      ),
    ).toBe(
      "/kits?campaign=summer&q=Real+Madrid&team=Real+Madrid&stock=1#results",
    );
  });

  it("removes cleared filters without leaving a dangling question mark", () => {
    expect(
      buildCatalogFilterUrl(
        { pathname: "/kits/la-liga", search: "?q=real&team=Real+Madrid&stock=1", hash: "" },
        { query: "", team: null, inStockOnly: false },
      ),
    ).toBe("/kits/la-liga");
  });

  it("carries era and sort", () => {
    expect(
      buildCatalogFilterUrl(
        { pathname: "/kits", search: "", hash: "" },
        { query: "", era: "retro", sort: "price-asc" },
      ),
    ).toBe("/kits?era=retro&sort=price-asc");
  });

  // A shared link should not carry params that change nothing.
  it("leaves the defaults out of the URL and strips them when reset", () => {
    expect(
      buildCatalogFilterUrl(
        { pathname: "/kits", search: "?era=retro&sort=name", hash: "" },
        { query: "", era: "all", sort: "featured" },
      ),
    ).toBe("/kits");
  });
});

describe("listTeams", () => {
  it("returns unique teams sorted alphabetically", () => {
    const list = [
      make({ id: "1", team: "France" }),
      make({ id: "2", team: "Argentina" }),
      make({ id: "3", team: "France" }),
    ];
    expect(listTeams(list)).toEqual(["Argentina", "France"]);
  });

  // A mystery tier's `team` is a label ("Mystery Kit"), not a real team, and it
  // must never appear as a filter option.
  it("excludes mystery tiers", () => {
    const list = [
      make({ id: "1", team: "France" }),
      make({ id: "2", name: "Mystery Kit", team: "Mystery Kit", isMystery: true }),
    ];
    expect(listTeams(list)).toEqual(["France"]);
  });
});

describe("sortProducts", () => {
  it("puts in-stock first, preserving order within each group", () => {
    const a = make({ id: "a", inStock: false });
    const b = make({ id: "b", inStock: true });
    const c = make({ id: "c", inStock: true });
    expect(sortProducts([a, b, c]).map((p) => p.id)).toEqual(["b", "c", "a"]);
  });
  it("does not mutate the input array", () => {
    const arr = [make({ id: "a", inStock: false }), make({ id: "b", inStock: true })];
    sortProducts(arr);
    expect(arr.map((p) => p.id)).toEqual(["a", "b"]);
  });

  const priced = [
    make({ id: "mid", name: "Bravo", price: 30 }),
    make({ id: "low", name: "Charlie", price: 20 }),
    make({ id: "high", name: "Alpha", price: 40 }),
  ];

  it("sorts by price in both directions", () => {
    expect(sortProducts(priced, "price-asc").map((p) => p.id)).toEqual(["low", "mid", "high"]);
    expect(sortProducts(priced, "price-desc").map((p) => p.id)).toEqual(["high", "mid", "low"]);
  });

  it("sorts by name", () => {
    expect(sortProducts(priced, "name").map((p) => p.id)).toEqual(["high", "mid", "low"]);
  });

  it("leaves the incoming order alone for featured and newest", () => {
    expect(sortProducts(priced, "featured").map((p) => p.id)).toEqual(["mid", "low", "high"]);
    expect(sortProducts(priced, "newest").map((p) => p.id)).toEqual(["mid", "low", "high"]);
  });

  // A sold-out kit at the top of a cheapest-first list is a worse result than
  // the sort is a good one, so the grouping always wins.
  it("keeps sold-out kits last whatever the sort", () => {
    const list = [
      make({ id: "cheap-gone", price: 5, inStock: false }),
      make({ id: "dear-here", price: 90 }),
      make({ id: "cheap-here", price: 10 }),
    ];
    expect(sortProducts(list, "price-asc").map((p) => p.id)).toEqual([
      "cheap-here",
      "dear-here",
      "cheap-gone",
    ]);
  });
});

describe("mysteryKits / regularKits", () => {
  const list = [
    make({ id: "arg", isMystery: false }),
    make({ id: "myst", name: "Mystery Kit", team: "Mystery", isMystery: true }),
    make({ id: "fra", isMystery: false }),
  ];
  it("mysteryKits returns only mystery tiers", () => {
    expect(mysteryKits(list).map((p) => p.id)).toEqual(["myst"]);
  });
  it("regularKits returns only normal kits", () => {
    expect(regularKits(list).map((p) => p.id)).toEqual(["arg", "fra"]);
  });
  it("the two are complementary partitions", () => {
    expect(mysteryKits(list).length + regularKits(list).length).toBe(list.length);
  });
});

describe("isUuid", () => {
  it("accepts canonical UUID strings", () => {
    expect(isUuid("692f94a4-6ad5-47dd-a155-b6fd0199d514")).toBe(true);
  });

  it("rejects malformed route params before they reach Supabase", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("692f94a4")).toBe(false);
  });
});

describe("shuffleCatalog", () => {
  // Mimics the real shape: one large batch imported after another, which is how
  // the rows arrive from the database.
  const batch = (prefix: string, n: number) =>
    Array.from({ length: n }, (_, i) => make({ id: `${prefix}-${i}`, team: prefix }));
  const clumped = [...batch("retro", 60), ...batch("season", 60)];

  it("keeps every product exactly once", () => {
    const out = shuffleCatalog(clumped);
    expect(out).toHaveLength(clumped.length);
    expect(new Set(out.map((p) => p.id))).toEqual(new Set(clumped.map((p) => p.id)));
  });

  it("does not mutate the input", () => {
    const input = [...clumped];
    shuffleCatalog(input);
    expect(input.map((p) => p.id)).toEqual(clumped.map((p) => p.id));
  });

  it("returns the same order every time, so a revisit does not reshuffle", () => {
    expect(shuffleCatalog(clumped).map((p) => p.id)).toEqual(
      shuffleCatalog(clumped).map((p) => p.id),
    );
  });

  it("is independent of the incoming order", () => {
    expect(shuffleCatalog([...clumped].reverse()).map((p) => p.id)).toEqual(
      shuffleCatalog(clumped).map((p) => p.id),
    );
  });

  it("breaks up a batch instead of leaving it in one block", () => {
    const out = shuffleCatalog(clumped);
    let run = 1;
    let longest = 1;
    for (let i = 1; i < out.length; i++) {
      run = out[i].team === out[i - 1].team ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    // Un-shuffled this is 60. Interleaved batches leave only short runs.
    expect(longest).toBeLessThan(10);
    // And the first screenful is no longer one batch.
    expect(new Set(out.slice(0, 12).map((p) => p.team)).size).toBe(2);
  });
});
