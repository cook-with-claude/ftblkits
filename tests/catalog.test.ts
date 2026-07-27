import { describe, it, expect } from "vitest";
import {
  isSoldOut,
  filterProducts,
  sortProducts,
  listTeams,
  mysteryKits,
  regularKits,
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
