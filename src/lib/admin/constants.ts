// Crypto-free admin constants. Kept separate from auth.ts so the Edge proxy
// (src/proxy.ts) can import the cookie name without pulling `node:crypto` — which
// auth.ts uses and the Edge Runtime does not support — into the Edge bundle.
export const ADMIN_COOKIE = "gz_admin";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const SESSION_TTL_MS = TTL_MS;
export const SESSION_MAX_AGE = Math.floor(TTL_MS / 1000);
