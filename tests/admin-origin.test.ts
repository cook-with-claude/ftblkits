import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { requireSameOrigin } from "@/lib/admin/server";

function request(origin?: string, headers: Record<string, string> = {}) {
  return new NextRequest("https://shop.example/api/admin/products", {
    method: "POST",
    headers: { ...(origin ? { origin } : {}), ...headers },
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

  it("rejects a malformed Origin header", () => {
    expect(requireSameOrigin(request("not-a-url"))?.status).toBe(403);
  });

  // Behind Netlify's proxy the internal request URL differs from the public
  // host; the Origin must be matched against the forwarded host the browser
  // actually addressed, not req.nextUrl.origin.
  it("accepts a proxied request whose Origin matches the forwarded host", () => {
    const req = request("https://the-goal-zone-kits.netlify.app", {
      "x-forwarded-host": "the-goal-zone-kits.netlify.app",
      "x-forwarded-proto": "https",
    });
    expect(requireSameOrigin(req)).toBeNull();
  });

  it("rejects a proxied request whose Origin is not the forwarded host", () => {
    const req = request("https://attacker.example", {
      "x-forwarded-host": "the-goal-zone-kits.netlify.app",
      "x-forwarded-proto": "https",
    });
    expect(requireSameOrigin(req)?.status).toBe(403);
  });
});
