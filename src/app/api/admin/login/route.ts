import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, SESSION_MAX_AGE, createSessionToken, passwordMatches } from "@/lib/admin/auth";
import { requireSameOrigin } from "@/lib/admin/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;

interface LoginAttempt {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, LoginAttempt>();
const MAX_TRACKED_CLIENTS = 1_000;

function loginKey(req: NextRequest): string {
  const netlifyIp = req.headers.get("x-nf-client-connection-ip")?.trim();
  if (netlifyIp) return netlifyIp;
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || req.headers.get("x-real-ip") || "unknown";
}

function rateLimited(req: NextRequest): boolean {
  const now = Date.now();
  const key = loginKey(req);
  const current = attempts.get(key);

  if (attempts.size >= MAX_TRACKED_CLIENTS) {
    for (const [client, attempt] of attempts) {
      if (attempt.resetAt <= now) attempts.delete(client);
    }
    if (attempts.size >= MAX_TRACKED_CLIENTS) {
      const oldest = attempts.keys().next().value as string | undefined;
      if (oldest) attempts.delete(oldest);
    }
  }

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > MAX_LOGIN_ATTEMPTS;
}

function clearAttempts(req: NextRequest) {
  attempts.delete(loginKey(req));
}

export async function POST(req: NextRequest) {
  const untrusted = requireSameOrigin(req);
  if (untrusted) return untrusted;

  if (rateLimited(req)) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
    );
  }

  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let ok = false;
  try {
    ok = typeof password === "string" && passwordMatches(password);
  } catch {
    return NextResponse.json(
      { error: "Admin login is not configured on the server." },
      { status: 500 },
    );
  }

  if (!ok) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  clearAttempts(req);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    priority: "high",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
