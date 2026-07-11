import crypto from "node:crypto";
import { SESSION_TTL_MS } from "./constants";

// Shared-password admin session. The cookie holds `<expiry>.<hmac>` where the
// HMAC is signed with ADMIN_SESSION_SECRET — so it can't be forged client-side.
// The cookie name / max-age live in ./constants (crypto-free) so the Edge proxy
// can reuse them; re-exported here for existing importers.
export { ADMIN_COOKIE, SESSION_MAX_AGE } from "./constants";
const TTL_MS = SESSION_TTL_MS;

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set");
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Constant-time password check (compares fixed-length SHA-256 hashes).
export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is not set");
  const hash = (v: string) => crypto.createHash("sha256").update(v).digest("hex");
  return safeEqual(hash(input), hash(expected));
}

export function createSessionToken(): string {
  const exp = String(Date.now() + TTL_MS);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  try {
    if (!token) return false;
    const dot = token.indexOf(".");
    if (dot < 0) return false;
    const exp = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (!safeEqual(sig, sign(exp))) return false;
    const expNum = Number(exp);
    return Number.isFinite(expNum) && expNum > Date.now();
  } catch {
    return false;
  }
}
