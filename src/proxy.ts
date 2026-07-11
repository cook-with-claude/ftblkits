import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin/constants";

// Edge-level guard for /admin (Next 16's `proxy` convention, formerly
// `middleware`). The Edge runtime lacks `node:crypto`, so we can't verify the
// cookie's HMAC signature here — that stays in the page
// (src/app/admin/page.tsx) and the /api/admin routes (`requireAdmin`), which run
// on Node. We import the cookie name from ./lib/admin/constants (crypto-free) to
// keep `node:crypto` out of the Edge bundle. What we *can* cheaply do is read the
// plaintext expiry that prefixes the token (`<expiryMs>.<signature>`) and, if
// it's missing or already past, evict the dead cookie so the browser stops
// replaying a stale session. The page then renders the login form as usual.
export function proxy(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.next();

  const exp = Number(token.slice(0, token.indexOf(".")));
  const stale = !Number.isFinite(exp) || exp <= Date.now();
  if (!stale) return NextResponse.next();

  const res = NextResponse.next();
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export const config = {
  matcher: ["/admin"],
};
