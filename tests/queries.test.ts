import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/supabase/client", () => ({
  supabase: { from: mocks.from },
}));

// The un-memoised layer. These tests are about query semantics — empty vs
// outage, row mapping, and the guards that skip a pointless round trip — so
// they deliberately bypass the cache wrappers, which would otherwise both
// require a Next request context and collapse the call counts being asserted.
import {
  fetchAllProducts as getAllProducts,
  fetchProductById as getProductById,
  fetchSections as getSections,
  fetchSectionBySlug as getSectionBySlug,
  fetchProductsInSection as getProductsInSection,
  checkCatalogConnection,
} from "@/lib/supabase/queries";

function builder(result: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    contains: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    // A real Supabase builder is thenable: every method chains, and awaiting the
    // chain is what runs the query. Modelling it that way keeps this mock valid
    // no matter how many filters/orders a query adds.
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.contains.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue(result);
  return query;
}

beforeEach(() => {
  mocks.from.mockReset();
});

describe("catalog query outcomes", () => {
  it("distinguishes an empty catalog from an outage", async () => {
    mocks.from.mockReturnValueOnce(builder({ data: [], error: null }));
    await expect(getAllProducts()).resolves.toEqual({ status: "ok", products: [] });

    mocks.from.mockReturnValueOnce(builder({ data: null, error: { message: "offline" } }));
    await expect(getAllProducts()).resolves.toEqual({ status: "unavailable", products: [] });
  });

  it("maps a missing valid UUID to not_found", async () => {
    mocks.from.mockReturnValueOnce(builder({ data: null, error: null }));
    await expect(getProductById("692f94a4-6ad5-47dd-a155-b6fd0199d514")).resolves.toEqual({
      status: "not_found",
    });
  });

  it("rejects malformed IDs without querying Supabase", async () => {
    await expect(getProductById("not-a-uuid")).resolves.toEqual({ status: "not_found" });
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("section query outcomes", () => {
  it("distinguishes no visible sections from an outage", async () => {
    mocks.from.mockReturnValueOnce(builder({ data: [], error: null }));
    await expect(getSections()).resolves.toEqual({ status: "ok", sections: [] });

    mocks.from.mockReturnValueOnce(builder({ data: null, error: { message: "offline" } }));
    await expect(getSections()).resolves.toEqual({ status: "unavailable", sections: [] });
  });

  it("maps a hidden or missing slug to not_found", async () => {
    mocks.from.mockReturnValueOnce(builder({ data: null, error: null }));
    await expect(getSectionBySlug("premier-league")).resolves.toEqual({ status: "not_found" });
  });

  it("rejects malformed slugs without querying Supabase", async () => {
    await expect(getSectionBySlug("La Liga")).resolves.toEqual({ status: "not_found" });
    await expect(getSectionBySlug("la,liga")).resolves.toEqual({ status: "not_found" });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("maps section rows to the camelCase Section shape", async () => {
    mocks.from.mockReturnValueOnce(
      builder({
        data: {
          id: "s1",
          slug: "la-liga",
          label: "La Liga",
          nav_group: "league",
          sort_order: 20,
          accent: "#ec1e5c",
          description: "Spanish top flight.",
          hidden: false,
        },
        error: null,
      }),
    );
    await expect(getSectionBySlug("la-liga")).resolves.toEqual({
      status: "ok",
      section: {
        id: "s1",
        slug: "la-liga",
        label: "La Liga",
        navGroup: "league",
        sortOrder: 20,
        accent: "#ec1e5c",
        description: "Spanish top flight.",
        hidden: false,
      },
    });
  });

  it("distinguishes an empty section from an outage", async () => {
    mocks.from.mockReturnValueOnce(builder({ data: [], error: null }));
    await expect(getProductsInSection("la-liga")).resolves.toEqual({ status: "ok", products: [] });

    mocks.from.mockReturnValueOnce(builder({ data: null, error: { message: "offline" } }));
    await expect(getProductsInSection("la-liga")).resolves.toEqual({
      status: "unavailable",
      products: [],
    });
  });

  it("treats a malformed section slug as empty, not an outage", async () => {
    await expect(getProductsInSection("La Liga")).resolves.toEqual({ status: "ok", products: [] });
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("catalog health probe", () => {
  it("requires both products and sections to be reachable", async () => {
    mocks.from
      .mockReturnValueOnce(builder({ data: [], error: null }))
      .mockReturnValueOnce(builder({ data: [], error: null }));
    await expect(checkCatalogConnection()).resolves.toBe(true);
    expect(mocks.from).toHaveBeenNthCalledWith(1, "products");
    expect(mocks.from).toHaveBeenNthCalledWith(2, "sections");

    mocks.from
      .mockReturnValueOnce(builder({ data: [], error: null }))
      .mockReturnValueOnce(builder({ data: null, error: { message: "permission denied" } }));
    await expect(checkCatalogConnection()).resolves.toBe(false);
  });
});
