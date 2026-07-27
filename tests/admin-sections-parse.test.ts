import { describe, it, expect } from "vitest";
import { parseSectionBody, toAdminSection } from "@/lib/admin/sections";
import { SECTION_LIMITS } from "@/lib/admin/validation";

const valid = { slug: "serie-a", label: "Serie A" };

// Mirrors the row() helper in admin-parse.test.ts.
function row(body: unknown, partial: boolean): Record<string, unknown> {
  const res = parseSectionBody(body, { partial });
  if (!res.ok) throw new Error(`expected ok, got error: ${res.error}`);
  return res.row;
}

describe("parseSectionBody — create", () => {
  it("accepts a minimal section and fills defaults", () => {
    expect(row(valid, false)).toEqual({
      slug: "serie-a",
      label: "Serie A",
      nav_group: "featured",
      sort_order: 0,
      accent: null,
      description: null,
      hidden: false,
    });
  });

  it("requires a slug and a label", () => {
    expect(parseSectionBody({ label: "Serie A" }, { partial: false })).toEqual({
      ok: false,
      error: "URL slug is required",
    });
    expect(parseSectionBody({ slug: "serie-a" }, { partial: false })).toEqual({
      ok: false,
      error: "Name is required",
    });
  });

  it("lowercases the slug", () => {
    expect(row({ ...valid, slug: "Serie-A" }, false).slug).toBe("serie-a");
  });

  it("rejects slugs that are not URL-safe", () => {
    for (const slug of ["Serie A", "serie_a", "serie--a", "-serie", "serie,a", "{serie}"]) {
      expect(parseSectionBody({ ...valid, slug }, { partial: false }).ok, slug).toBe(false);
    }
  });

  it("rejects slugs that would shadow a real route", () => {
    for (const slug of ["admin", "api", "jersey", "kits"]) {
      const res = parseSectionBody({ ...valid, slug }, { partial: false });
      expect(res.ok, slug).toBe(false);
    }
  });

  it("enforces the label and description limits", () => {
    expect(parseSectionBody({ ...valid, label: "x".repeat(SECTION_LIMITS.label) }, { partial: false }).ok).toBe(true);
    expect(parseSectionBody({ ...valid, label: "x".repeat(SECTION_LIMITS.label + 1) }, { partial: false }).ok).toBe(false);
    expect(
      parseSectionBody({ ...valid, description: "x".repeat(SECTION_LIMITS.description + 1) }, { partial: false }).ok,
    ).toBe(false);
  });

  it("accepts only the closed nav-group set", () => {
    expect(row({ ...valid, navGroup: "league" }, false).nav_group).toBe("league");
    expect(parseSectionBody({ ...valid, navGroup: "tournament" }, { partial: false })).toEqual({
      ok: false,
      error: "Pick a valid menu group",
    });
  });

  it("validates and normalizes the accent colour", () => {
    expect(row({ ...valid, accent: "#EC1E5C" }, false).accent).toBe("#ec1e5c");
    expect(row({ ...valid, accent: "" }, false).accent).toBeNull();
    expect(row({ ...valid, accent: null }, false).accent).toBeNull();
    for (const accent of ["#fff", "red", "ec1e5c", "#gggggg"]) {
      expect(parseSectionBody({ ...valid, accent }, { partial: false }).ok, accent).toBe(false);
    }
  });

  it("requires sortOrder to be a whole number in range", () => {
    expect(row({ ...valid, sortOrder: 20 }, false).sort_order).toBe(20);
    for (const sortOrder of [1.5, -1, 10_001, "abc"]) {
      expect(parseSectionBody({ ...valid, sortOrder }, { partial: false }).ok, String(sortOrder)).toBe(false);
    }
  });

  it("is strict about hidden, matching the products parser", () => {
    expect(row({ ...valid, hidden: true }, false).hidden).toBe(true);
    expect(row({ ...valid, hidden: "false" }, false).hidden).toBe(false);
    expect(parseSectionBody({ ...valid, hidden: "yes" }, { partial: false }).ok).toBe(false);
    expect(parseSectionBody({ ...valid, hidden: 1 }, { partial: false }).ok).toBe(false);
  });

  it("rejects a non-object body", () => {
    expect(parseSectionBody(null, { partial: false }).ok).toBe(false);
    expect(parseSectionBody("nope", { partial: false }).ok).toBe(false);
    expect(parseSectionBody([], { partial: false }).ok).toBe(false);
  });
});

describe("parseSectionBody — update", () => {
  it("includes only the provided keys", () => {
    expect(row({ label: "Serie A Renamed" }, true)).toEqual({ label: "Serie A Renamed" });
  });

  it("rejects an empty patch", () => {
    expect(parseSectionBody({}, { partial: true })).toEqual({
      ok: false,
      error: "Nothing to update",
    });
  });

  it("clears the accent and description when sent as null", () => {
    expect(row({ accent: null, description: null }, true)).toEqual({
      accent: null,
      description: null,
    });
  });
});

describe("toAdminSection", () => {
  it("maps snake_case columns to the camelCase AdminSection shape", () => {
    expect(
      toAdminSection({
        id: "s1",
        slug: "la-liga",
        label: "La Liga",
        nav_group: "league",
        sort_order: 20,
        accent: null,
        description: null,
        hidden: true,
      }),
    ).toEqual({
      id: "s1",
      slug: "la-liga",
      label: "La Liga",
      navGroup: "league",
      sortOrder: 20,
      accent: null,
      description: null,
      hidden: true,
    });
  });
});
