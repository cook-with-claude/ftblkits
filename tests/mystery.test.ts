import { describe, expect, it } from "vitest";
import {
  getMysteryProduct,
  getMysteryProductsInSection,
  MYSTERY_PRODUCTS,
  MYSTERY_SECTIONS,
  mysteryKitDescription,
} from "@/lib/mystery";

describe("mystery kit copy", () => {
  it("always describes replica inventory without authenticity guarantees", () => {
    const copy = mysteryKitDescription();
    expect(copy.toLowerCase()).toContain("replica");
    expect(copy.toLowerCase()).not.toContain("genuine");
    expect(copy.toLowerCase()).not.toContain("guaranteed");
    expect(copy).not.toContain("$25");
  });

  it("ships a complete, uniquely-routed eight-box collection", () => {
    expect(MYSTERY_PRODUCTS).toHaveLength(8);
    expect(new Set(MYSTERY_PRODUCTS.map((product) => product.id)).size).toBe(8);
    expect(new Set(MYSTERY_PRODUCTS.map((product) => product.imageUrl)).size).toBe(8);

    for (const product of MYSTERY_PRODUCTS) {
      expect(product.isMystery).toBe(true);
      expect(product.inStock).toBe(true);
      expect(product.sections).toContain("mystery-boxes");
      expect(product.imageUrl).toMatch(/^\/images\/mystery\/.+\.webp$/);
      expect(getMysteryProduct(product.id)).toEqual(product);
    }
  });

  it("fills every mystery navigation section", () => {
    expect(MYSTERY_SECTIONS).toHaveLength(5);
    for (const section of MYSTERY_SECTIONS) {
      expect(getMysteryProductsInSection(section.slug).length).toBeGreaterThan(0);
    }
    expect(getMysteryProductsInSection("league-mystery-boxes")).toHaveLength(5);
  });
});
