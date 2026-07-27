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

import sitemap, { dynamic } from "@/app/sitemap";

describe("sitemap freshness", () => {
  it("opts out of the metadata route's default cache", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("includes the latest visible section routes", async () => {
    mocks.getAllProducts.mockResolvedValueOnce({ status: "ok", products: [] });
    mocks.getSections.mockResolvedValueOnce({
      status: "ok",
      sections: [
        {
          id: "section-1",
          slug: "la-liga",
          label: "La Liga",
          navGroup: "league",
          sortOrder: 10,
          accent: null,
          description: null,
          hidden: false,
        },
      ],
    });

    await expect(sitemap()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "https://goalzone.example/kits/la-liga" }),
      ]),
    );
  });
});
