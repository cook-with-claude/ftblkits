import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, SESSION_MAX_AGE, createSessionToken, passwordMatches } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
