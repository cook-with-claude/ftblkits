import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAllProducts: vi.fn(),
  getSections: vi.fn(),
}));

vi.mock("@/lib/config", () => ({
  SITE_URL: "https://goalzone.example",
}));

vi.mock("@/lib/supabase/queries", () => ({
  getAllProducts: mocks.getAllProducts,
  getSections: mocks.getSections,
}));

import sitemap, { revalidate } from "@/app/sitemap";

describe("sitemap freshness", () => {
  // Was force-dynamic, which re-queried the whole catalog for every crawler
  // hit. Freshness after an admin edit comes from the CATALOG_TAG purge; this
  // is only the ceiling if a purge fails to propagate, and it must stay in step
  // with MAX_AGE_SECONDS in queries.ts.
  it("bounds staleness rather than opting out of caching entirely", () => {
    expect(revalidate).toBe(300);
  });

  function section(slug: string) {
    return {
      id: `section-${slug}`,
      slug,
      label: slug,
      navGroup: "league",
      sortOrder: 10,
      accent: null,
      description: null,
      hidden: false,
    };
  }

  function product(id: string, sections: string[]) {
    return {
      id,
      name: id,
      team: "Team",
      price: 30,
      sizes: ["M"],
      imageUrl: null,
      inStock: true,
      description: null,
      isMystery: false,
      sections,
    };
  }

  it("includes the latest visible section routes once they hold kits", async () => {
    mocks.getAllProducts.mockResolvedValueOnce({
      status: "ok",
      products: [product("p1", ["la-liga"])],
    });
    mocks.getSections.mockResolvedValueOnce({ status: "ok", sections: [section("la-liga")] });

    await expect(sitemap()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "https://goalzone.example/kits/la-liga" }),
      ]),
    );
  });

  // Sections go live in the nav before they are stocked, so the shop's shape is
  // browsable while it fills up. An empty one is thin content, so it is kept out
  // of the sitemap until it has kits -- it is still reachable and crawlable.
  it("leaves an empty section out until it is stocked", async () => {
    mocks.getAllProducts.mockResolvedValueOnce({
      status: "ok",
      products: [product("p1", ["la-liga"])],
    });
    mocks.getSections.mockResolvedValueOnce({
      status: "ok",
      sections: [section("la-liga"), section("mls")],
    });

    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain("https://goalzone.example/kits/la-liga");
    expect(urls).not.toContain("https://goalzone.example/kits/mls");
  });

  it("still lists the home, browse-all and information routes when nothing is stocked", async () => {
    mocks.getAllProducts.mockResolvedValueOnce({ status: "ok", products: [] });
    mocks.getSections.mockResolvedValueOnce({ status: "ok", sections: [section("mls")] });

    const urls = (await sitemap()).map((entry) => entry.url);
    // The information pages are static prose and do not depend on stock, so
    // they belong here whatever the catalogue is doing. What must stay out is
    // anything catalog-derived.
    expect(urls).toEqual([
      "https://goalzone.example",
      "https://goalzone.example/kits",
      "https://goalzone.example/faq",
      "https://goalzone.example/about",
      "https://goalzone.example/contact",
      "https://goalzone.example/privacy",
      "https://goalzone.example/terms",
    ]);
    expect(urls.some((url) => url.includes("/kits/"))).toBe(false);
    expect(urls.some((url) => url.includes("/jersey/"))).toBe(false);
  });
});
