import { NextResponse, type NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, requireSameOrigin } from "@/lib/admin/server";
import { parseSectionBody, SECTION_COLUMNS, toAdminSection } from "@/lib/admin/sections";
import { purgeCatalog } from "@/lib/cache-tags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List every section, including hidden ones, for the admin dashboard.
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("sections")
    .select(SECTION_COLUMNS)
    .order("nav_group", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    console.error("[admin/sections] list failed", error);
    return NextResponse.json({ error: "Could not load sections" }, { status: 500 });
  }
  return NextResponse.json({ sections: (data ?? []).map(toAdminSection) });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const untrusted = requireSameOrigin(req);
  if (untrusted) return untrusted;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = parseSectionBody(body, { partial: false });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("sections")
    .insert(parsed.row)
    .select(SECTION_COLUMNS)
    .single();

  if (error) {
    // 23505 = unique violation on slug. Report it as the user's problem, not a
    // server error, so the form can point at the field.
    if (error.code === "23505") {
      return NextResponse.json({ error: "That URL slug is already taken" }, { status: 409 });
    }
    console.error("[admin/sections] create failed", error);
    return NextResponse.json({ error: "Could not add section" }, { status: 500 });
  }
  purgeCatalog();
  return NextResponse.json({ section: toAdminSection(data) }, { status: 201 });
}
