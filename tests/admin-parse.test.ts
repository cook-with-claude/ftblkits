import { beforeAll, describe, it, expect } from "vitest";
import { parseProductBody, toAdminProduct, validatePublishableProduct } from "@/lib/admin/server";
import { PRODUCT_LIMITS } from "@/lib/admin/validation";

const IMAGE_URL = "https://project.supabase.co/storage/v1/object/public/kits/test.jpg";

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
});

// Helper to pull the row out of a successful parse, failing loudly otherwise.
function row(body: unknown, partial: boolean): Record<string, unknown> {
  const res = parseProductBody(body, { partial });
  if (!res.ok) throw new Error(`expected ok, got error: ${res.error}`);
  return res.row;
}

describe("parseProductBody — create (partial: false)", () => {
  const valid = {
    name: "Argentina Home",
    team: "Argentina",
    price: 28,
    sizes: ["S", "M"],
    imageUrl: IMAGE_URL,
  };

  it("accepts a complete visible listing and fills defaults", () => {
    const r = row(valid, false);
    expect(r).toMatchObject({
      name: "Argentina Home",
      team: "Argentina",
      price: 28,
      sizes: ["S", "M"],
      image_url: IMAGE_URL,
      in_stock: true,
      hidden: false,
      is_mystery: false,
    });
  });

  it("allows an incomplete hidden draft", () => {
    const r = row({ name: "Draft", team: "Argentina", price: 10, hidden: true }, false);
    expect(r).toMatchObject({ hidden: true, sizes: [], image_url: null });
  });

  it("requires name", () => {
    const res = parseProductBody({ team: "Argentina", price: 28 }, { partial: false });
    expect(res).toEqual({ ok: false, error: "Name is required" });
  });

  it("requires team", () => {
    const res = parseProductBody({ name: "A", price: 28 }, { partial: false });
    expect(res).toEqual({ ok: false, error: "Team is required" });
  });

  it("requires price", () => {
    const res = parseProductBody({ name: "A", team: "Argentina" }, { partial: false });
    expect(res).toEqual({ ok: false, error: "Price is required" });
  });

  // An admin tab opened before the country->team rename still posts `country`.
  // Without an explicit rejection the key is ignored and everything else saves,
  // which looks like success but silently drops the field.
  it("rejects the pre-rename `country` key instead of silently ignoring it", () => {
    const { team, ...withoutTeam } = valid;
    void team;
    const res = parseProductBody({ ...withoutTeam, country: "Argentina" }, { partial: false });
    expect(res.ok).toBe(false);

    const patch = parseProductBody({ country: "Brazil" }, { partial: true });
    expect(patch.ok).toBe(false);
  });

  it("still accepts a body that sends both keys, preferring team", () => {
    const r = row({ ...valid, country: "Ignored" }, false);
    expect(r.team).toBe("Argentina");
    expect(r.country).toBeUndefined();
  });

  describe("sections", () => {
    it("defaults to an empty array on create", () => {
      expect(row(valid, false).sections).toEqual([]);
    });

    it("accepts an array of slugs and deduplicates", () => {
      expect(row({ ...valid, sections: ["la-liga", "la-liga", " serie-a "] }, false).sections).toEqual([
        "la-liga",
        "serie-a",
      ]);
    });

    it("accepts a comma-separated string, matching how sizes are handled", () => {
      expect(row({ ...valid, sections: "la-liga, serie-a" }, false).sections).toEqual([
        "la-liga",
        "serie-a",
      ]);
    });

    it("rejects slugs that would corrupt the section query or a URL", () => {
      for (const bad of ["La Liga", "la,liga", "{la-liga}", "la--liga", "la/liga"]) {
        const res = parseProductBody({ ...valid, sections: [bad] }, { partial: false });
        expect(res.ok, bad).toBe(false);
      }
    });

    it("caps how many sections one kit can be in", () => {
      const many = Array.from({ length: PRODUCT_LIMITS.sections + 1 }, (_, i) => `section-${i}`);
      expect(parseProductBody({ ...valid, sections: many }, { partial: false }).ok).toBe(false);
    });

    it("allows clearing every section on a patch", () => {
      expect(row({ sections: [] }, true).sections).toEqual([]);
    });
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

  it("accepts decimal prices with two places", () => {
    expect(row({ ...valid, price: 26.99 }, false).price).toBe(26.99);
  });

  it("rejects prices with more than two decimal places", () => {
    expect(parseProductBody({ ...valid, price: 26.999 }, { partial: false }).ok).toBe(false);
  });

  it("trims whitespace-only name to an error", () => {
    const res = parseProductBody({ ...valid, name: "   " }, { partial: false });
    expect(res).toEqual({ ok: false, error: "Name is required" });
  });
});

describe("parseProductBody — sizes coercion", () => {
  const base = { name: "A", team: "B", price: 1, imageUrl: IMAGE_URL };

  it("splits a comma-separated string and trims", () => {
    expect(row({ ...base, sizes: "S, M , L" }, false).sizes).toEqual(["S", "M", "L"]);
  });

  it("accepts an array and drops empties", () => {
    expect(row({ ...base, sizes: ["S", "", " L "] }, false).sizes).toEqual(["S", "L"]);
  });

  it("deduplicates sizes case-insensitively", () => {
    expect(row({ ...base, sizes: ["M", "m", " L "] }, false).sizes).toEqual(["M", "L"]);
  });
});

describe("parseProductBody — flags & nullable fields", () => {
  const base = { name: "A", team: "B", price: 1, sizes: ["M"], imageUrl: IMAGE_URL };

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
    const r = row({ ...base, hidden: true, description: "   ", imageUrl: "" }, false);
    expect(r.description).toBeNull();
    expect(r.image_url).toBeNull();
  });

  it("rejects arbitrary external image hosts", () => {
    const res = parseProductBody({ ...base, imageUrl: "https://example.com/kit.jpg" }, { partial: false });
    expect(res.ok).toBe(false);
  });

  it("enforces text length limits", () => {
    const res = parseProductBody({ ...base, name: "x".repeat(PRODUCT_LIMITS.name + 1) }, { partial: false });
    expect(res.ok).toBe(false);
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
      team: "Argentina",
      price: "28",
      sizes: null,
      image_url: null,
      in_stock: true,
      hidden: false,
      is_mystery: null,
      description: null,
      sections: null,
    });
    expect(product).toEqual({
      id: "id-1",
      name: "Argentina Home",
      team: "Argentina",
      price: 28,
      sizes: [],
      imageUrl: null,
      inStock: true,
      hidden: false,
      isMystery: false,
      description: null,
      sections: [],
    });
  });
});

describe("validatePublishableProduct", () => {
  it("requires sizes and a managed photo for visible listings", () => {
    expect(validatePublishableProduct({ hidden: false, sizes: [], image_url: null })).toContain("size");
    expect(validatePublishableProduct({ hidden: false, sizes: ["M"], image_url: null })).toContain("photo");
  });

  it("allows hidden drafts to remain incomplete", () => {
    expect(validatePublishableProduct({ hidden: true, sizes: [], image_url: null })).toBeNull();
  });

  it("allows a visible mystery kit without a photo", () => {
    expect(
      validatePublishableProduct({ hidden: false, sizes: ["M"], image_url: null, is_mystery: true }),
    ).toBeNull();
  });

  it("still requires sizes for a visible mystery kit", () => {
    expect(
      validatePublishableProduct({ hidden: false, sizes: [], image_url: null, is_mystery: true }),
    ).toContain("size");
  });
});
