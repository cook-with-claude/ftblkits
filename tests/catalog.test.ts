import { describe, it, expect } from "vitest";
import { isSoldOut, filterProducts, sortProducts, listCountries, latestArrivals } from "@/lib/catalog";
import { isUuid } from "@/lib/ids";
import type { Product } from "@/lib/types";

function make(overrides: Partial<Product> = {}): Product {
  return {
    id: overrides.id ?? "id",
    name: overrides.name ?? "Argentina Home",
    country: overrides.country ?? "Argentina",
    price: overrides.price ?? 28,
    sizes: overrides.sizes ?? ["S", "M", "L"],
    imageUrl: overrides.imageUrl ?? null,
    inStock: overrides.inStock ?? true,
    description: overrides.description ?? null,
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
    make({ id: "arg", name: "Argentina Home", country: "Argentina" }),
    make({ id: "fra", name: "France Away", country: "France" }),
  ];
  it("returns all when query is empty", () => {
    expect(filterProducts(list, { query: "" }).length).toBe(2);
  });
  it("matches the name case-insensitively", () => {
    expect(filterProducts(list, { query: "argent" }).map((p) => p.id)).toEqual(["arg"]);
  });
  it("matches the country", () => {
    expect(filterProducts(list, { query: "france" }).map((p) => p.id)).toEqual(["fra"]);
  });
  it("filters by country when provided", () => {
    expect(filterProducts(list, { query: "", country: "France" }).map((p) => p.id)).toEqual(["fra"]);
  });
  it("hides sold-out products when inStockOnly is set", () => {
    const withSoldOut = [...list, make({ id: "bra", country: "Brazil", inStock: false })];
    expect(filterProducts(withSoldOut, { query: "", inStockOnly: true }).map((p) => p.id)).toEqual([
      "arg",
      "fra",
    ]);
  });
  it("combines query and country filters", () => {
    const more = [...list, make({ id: "arg2", name: "Argentina Away", country: "Argentina" })];
    expect(
      filterProducts(more, { query: "away", country: "Argentina" }).map((p) => p.id),
    ).toEqual(["arg2"]);
  });
});

describe("listCountries", () => {
  it("returns unique countries sorted alphabetically", () => {
    const list = [
      make({ id: "1", country: "France" }),
      make({ id: "2", country: "Argentina" }),
      make({ id: "3", country: "France" }),
    ];
    expect(listCountries(list)).toEqual(["Argentina", "France"]);
  });
});

describe("latestArrivals", () => {
  it("returns the first N products in incoming (newest-first) order", () => {
    const list = [make({ id: "a" }), make({ id: "b" }), make({ id: "c" })];
    expect(latestArrivals(list, 2).map((p) => p.id)).toEqual(["a", "b"]);
  });
  it("returns all products when fewer than the limit", () => {
    const list = [make({ id: "a" })];
    expect(latestArrivals(list, 5).map((p) => p.id)).toEqual(["a"]);
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

describe("isUuid", () => {
  it("accepts canonical UUID strings", () => {
    expect(isUuid("692f94a4-6ad5-47dd-a155-b6fd0199d514")).toBe(true);
  });

  it("rejects malformed route params before they reach Supabase", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("692f94a4")).toBe(false);
  });
});
