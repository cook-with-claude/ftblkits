import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { requireSameOrigin } from "@/lib/admin/server";

function request(origin?: string) {
  return new NextRequest("https://shop.example/api/admin/products", {
    method: "POST",
    headers: origin ? { origin } : {},
  });
}

describe("requireSameOrigin", () => {
  it("accepts same-origin admin mutations", () => {
    expect(requireSameOrigin(request("https://shop.example"))).toBeNull();
  });

  it("rejects cross-origin admin mutations", () => {
    expect(requireSameOrigin(request("https://attacker.example"))?.status).toBe(403);
  });

  it("rejects mutation requests without an Origin header", () => {
    expect(requireSameOrigin(request())?.status).toBe(403);
  });
});
