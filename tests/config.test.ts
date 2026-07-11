import { afterEach, describe, expect, it } from "vitest";
import { normalizeSiteUrl, publicConfigurationStatus } from "@/lib/config";

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
});

describe("public configuration", () => {
  it("normalizes a configured URL to its origin", () => {
    expect(normalizeSiteUrl("https://shop.example/path/")).toBe("https://shop.example");
  });

  it("falls back safely for an invalid site URL", () => {
    expect(normalizeSiteUrl("javascript:alert(1)")).toBe("https://the-goal-zone-kits.netlify.app");
  });

  it("reports missing configuration without exposing values", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(publicConfigurationStatus()).toEqual({
      supabaseUrl: false,
      supabaseKey: false,
      whatsapp: false,
      siteUrl: false,
    });
  });
});
