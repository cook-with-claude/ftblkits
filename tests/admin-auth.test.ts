import crypto from "node:crypto";
import { describe, it, expect, beforeAll } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
  passwordMatches,
} from "@/lib/admin/auth";

const SECRET = "test-session-secret";
const PASSWORD = "hunter2";

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = SECRET;
  process.env.ADMIN_PASSWORD = PASSWORD;
});

// Replicates auth.ts's signing so the test can craft tokens (e.g. an expired one)
// that carry a valid signature but an invalid payload.
function sign(payload: string): string {
  const key = crypto
    .createHash("sha256")
    .update(SECRET)
    .update("\0")
    .update(PASSWORD)
    .digest();
  return crypto.createHmac("sha256", key).update(payload).digest("hex");
}

describe("session tokens", () => {
  it("round-trips a freshly issued token", () => {
    expect(verifySessionToken(createSessionToken())).toBe(true);
  });

  it("rejects an empty or missing token", () => {
    expect(verifySessionToken("")).toBe(false);
    expect(verifySessionToken(undefined)).toBe(false);
    expect(verifySessionToken(null)).toBe(false);
  });

  it("rejects a token with no signature separator", () => {
    expect(verifySessionToken("no-dot-here")).toBe(false);
  });

  it("rejects a token whose signature was tampered with", () => {
    const token = createSessionToken();
    const tampered = token.slice(0, -1) + (token.endsWith("0") ? "1" : "0");
    expect(verifySessionToken(tampered)).toBe(false);
  });

  it("rejects a token whose payload was swapped (signature no longer matches)", () => {
    const exp = String(Date.now() + 60_000);
    const forged = `${exp}.${sign("a-different-payload")}`;
    expect(verifySessionToken(forged)).toBe(false);
  });

  it("rejects a correctly-signed but expired token", () => {
    const past = String(Date.now() - 1000);
    const expired = `${past}.${sign(past)}`;
    expect(verifySessionToken(expired)).toBe(false);
  });

  it("invalidates an existing token when the manager password changes", () => {
    const token = createSessionToken();
    process.env.ADMIN_PASSWORD = "rotated-password";
    expect(verifySessionToken(token)).toBe(false);
    process.env.ADMIN_PASSWORD = PASSWORD;
  });
});

describe("passwordMatches", () => {
  it("accepts the configured password", () => {
    expect(passwordMatches(PASSWORD)).toBe(true);
  });

  it("rejects an incorrect password", () => {
    expect(passwordMatches("wrong")).toBe(false);
  });

  it("rejects a password of a different length without throwing", () => {
    expect(passwordMatches("")).toBe(false);
    expect(passwordMatches(PASSWORD + "extra")).toBe(false);
  });
});
