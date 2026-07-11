import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/supabase/client", () => ({
  supabase: { from: mocks.from },
}));

import { getAllProducts, getProductById } from "@/lib/supabase/queries";

function builder(result: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockResolvedValue(result);
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
