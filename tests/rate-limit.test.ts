import { describe, expect, it, vi } from "vitest";
import handler, { config } from "../netlify/edge-functions/admin-login-rate-limit";

describe("production admin login rate limit", () => {
  it("targets only the login endpoint with the intended threshold", () => {
    expect(config).toEqual({
      path: "/api/admin/login",
      rateLimit: {
        action: "rate_limit",
        aggregateBy: ["ip", "domain"],
        windowLimit: 10,
        windowSize: 900,
      },
    });
  });

  it("passes allowed requests to the Next.js route", async () => {
    const response = new Response("ok");
    const next = vi.fn().mockResolvedValue(response);
    await expect(handler(new Request("https://shop.example/api/admin/login"), { next })).resolves.toBe(response);
    expect(next).toHaveBeenCalledOnce();
  });
});
