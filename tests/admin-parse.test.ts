import { describe, it, expect } from "vitest";
import { parseProductBody, toAdminProduct } from "@/lib/admin/server";

// Helper to pull the row out of a successful parse, failing loudly otherwise.
function row(body: unknown, partial: boolean): Record<string, unknown> {
  const res = parseProductBody(body, { partial });
  if (!res.ok) throw new Error(`expected ok, got error: ${res.error}`);
  return res.row;
}

describe("parseProductBody — create (partial: false)", () => {
  const valid = { name: "Argentina Home", country: "Argentina", price: 28 };

  it("accepts a minimal valid body and fills defaults", () => {
    const r = row(valid, false);
    expect(r).toMatchObject({
      name: "Argentina Home",
      country: "Argentina",
      price: 28,
      sizes: [],
      in_stock: true,
      hidden: false,
      is_mystery: false,
    });
  });

  it("requires name", () => {
    const res = parseProductBody({ country: "Argentina", price: 28 }, { partial: false });
    expect(res).toEqual({ ok: false, error: "Name is required" });
  });

  it("requires country", () => {
    const res = parseProductBody({ name: "A", price: 28 }, { partial: false });
    expect(res).toEqual({ ok: false, error: "Country is required" });
  });

  it("requires price", () => {
    const res = parseProductBody({ name: "A", country: "Argentina" }, { partial: false });
    expect(res).toEqual({ ok: false, error: "Price is required" });
  });

  it("rejects a negative price", () => {
    const res = parseProductBody({ ...valid, price: -5 }, { partial: false });
    expect(res.ok).toBe(false);
  });

  it("rejects a non-numeric price", () => {
    const res = parseProductBody({ ...valid, price: "abc" }, { partial: false });
    expect(res.ok).toBe(false);
  });

  it("rejects a blank price string", () => {
    const res = parseProductBody({ ...valid, price: "   " }, { partial: false });
    expect(res.ok).toBe(false);
  });

  it("trims whitespace-only name to an error", () => {
    const res = parseProductBody({ ...valid, name: "   " }, { partial: false });
    expect(res).toEqual({ ok: false, error: "Name is required" });
  });
});

describe("parseProductBody — sizes coercion", () => {
  const base = { name: "A", country: "B", price: 1 };

  it("splits a comma-separated string and trims", () => {
    expect(row({ ...base, sizes: "S, M , L" }, false).sizes).toEqual(["S", "M", "L"]);
  });

  it("accepts an array and drops empties", () => {
    expect(row({ ...base, sizes: ["S", "", " L "] }, false).sizes).toEqual(["S", "L"]);
  });
});

describe("parseProductBody — flags & nullable fields", () => {
  const base = { name: "A", country: "B", price: 1 };

  it("accepts boolean flags", () => {
    const r = row({ ...base, inStock: true, hidden: false, isMystery: true }, false);
    expect(r.in_stock).toBe(true);
    expect(r.hidden).toBe(false);
    expect(r.is_mystery).toBe(true);
  });

  it("accepts explicit true/false strings", () => {
    const r = row({ ...base, inStock: "false", hidden: "true", isMystery: "false" }, false);
    expect(r.in_stock).toBe(false);
    expect(r.hidden).toBe(true);
    expect(r.is_mystery).toBe(false);
  });

  it("rejects ambiguous boolean values", () => {
    expect(parseProductBody({ ...base, inStock: 1 }, { partial: false }).ok).toBe(false);
    expect(parseProductBody({ ...base, hidden: 0 }, { partial: false }).ok).toBe(false);
    expect(parseProductBody({ ...base, isMystery: "yes" }, { partial: false }).ok).toBe(false);
  });

  it("normalises blank description / imageUrl to null", () => {
    const r = row({ ...base, description: "   ", imageUrl: "" }, false);
    expect(r.description).toBeNull();
    expect(r.image_url).toBeNull();
  });
});

describe("parseProductBody — update (partial: true)", () => {
  it("includes only provided keys", () => {
    const r = row({ price: 30 }, true);
    expect(r).toEqual({ price: 30 });
  });

  it("errors on an empty body", () => {
    const res = parseProductBody({}, { partial: true });
    expect(res).toEqual({ ok: false, error: "Nothing to update" });
  });

  it("rejects a non-object body", () => {
    expect(parseProductBody(null, { partial: true }).ok).toBe(false);
    expect(parseProductBody("nope", { partial: true }).ok).toBe(false);
  });
});

describe("toAdminProduct", () => {
  it("maps snake_case columns to the camelCase AdminProduct shape", () => {
    const product = toAdminProduct({
      id: "id-1",
      name: "Argentina Home",
      country: "Argentina",
      price: "28",
      sizes: null,
      image_url: null,
      in_stock: true,
      hidden: false,
      is_mystery: null,
      description: null,
    });
    expect(product).toEqual({
      id: "id-1",
      name: "Argentina Home",
      country: "Argentina",
      price: 28,
      sizes: [],
      imageUrl: null,
      inStock: true,
      hidden: false,
      isMystery: false,
      description: null,
    });
  });
});
