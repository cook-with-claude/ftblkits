import { describe, it, expect } from "vitest";
import { isSoldOut, filterProducts, sortProducts } from "@/lib/catalog";
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
