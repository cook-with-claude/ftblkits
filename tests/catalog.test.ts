import { describe, it, expect } from "vitest";
import {
  isSoldOut,
  availableSizes,
  sortJerseys,
  filterJerseys,
} from "@/lib/catalog";
import type { Jersey } from "@/lib/types";

function make(overrides: Partial<Jersey> = {}): Jersey {
  return {
    _id: overrides._id ?? "id",
    team: overrides.team ?? "Argentina",
    slug: overrides.slug ?? "argentina-home",
    kitType: overrides.kitType ?? "Home",
    confederation: overrides.confederation ?? {
      id: "south-america",
      name: "South America",
    },
    price: overrides.price ?? 28,
    photos: overrides.photos ?? [{ url: "x", alt: "x" }],
    sizes:
      overrides.sizes ??
      [
        { size: "S", inStock: true },
        { size: "M", inStock: true },
      ],
    featured: overrides.featured ?? false,
  };
}

describe("isSoldOut", () => {
  it("is false when at least one size is in stock", () => {
    expect(isSoldOut(make({ sizes: [{ size: "S", inStock: false }, { size: "M", inStock: true }] }))).toBe(false);
  });
  it("is true when every size is out of stock", () => {
    expect(isSoldOut(make({ sizes: [{ size: "S", inStock: false }, { size: "M", inStock: false }] }))).toBe(true);
  });
  it("is true when there are no sizes", () => {
    expect(isSoldOut(make({ sizes: [] }))).toBe(true);
  });
});

describe("availableSizes", () => {
  it("returns only in-stock sizes", () => {
    const j = make({ sizes: [{ size: "S", inStock: false }, { size: "L", inStock: true }] });
    expect(availableSizes(j)).toEqual(["L"]);
  });
});

describe("sortJerseys", () => {
  it("puts featured first, then alphabetical by team", () => {
    const a = make({ _id: "a", team: "Brazil", featured: false });
    const b = make({ _id: "b", team: "Spain", featured: true });
    const c = make({ _id: "c", team: "Argentina", featured: false });
    expect(sortJerseys([a, b, c]).map((j) => j._id)).toEqual(["b", "c", "a"]);
  });
  it("does not mutate the input array", () => {
    const arr = [make({ _id: "a", team: "Brazil" }), make({ _id: "b", team: "Argentina" })];
    sortJerseys(arr);
    expect(arr.map((j) => j._id)).toEqual(["a", "b"]);
  });
});

describe("filterJerseys", () => {
  const list = [
    make({ _id: "arg", team: "Argentina", confederation: { id: "south-america", name: "South America" } }),
    make({ _id: "fra", team: "France", confederation: { id: "europe", name: "Europe" } }),
  ];
  it("returns all when no query and confederation is 'all'", () => {
    expect(filterJerseys(list, { query: "", confederation: "all" }).length).toBe(2);
  });
  it("filters by case-insensitive team substring", () => {
    expect(filterJerseys(list, { query: "fra", confederation: "all" }).map((j) => j._id)).toEqual(["fra"]);
  });
  it("filters by confederation", () => {
    expect(filterJerseys(list, { query: "", confederation: "europe" }).map((j) => j._id)).toEqual(["fra"]);
  });
});
