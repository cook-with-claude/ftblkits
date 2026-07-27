import { NextResponse, type NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, requireSameOrigin } from "@/lib/admin/server";
import { parseSectionBody, SECTION_COLUMNS, toAdminSection } from "@/lib/admin/sections";
import { isUuid } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const untrusted = requireSameOrigin(req);
  if (untrusted) return untrusted;

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = parseSectionBody(body, { partial: true });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const supabase = getAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("sections")
    .select(SECTION_COLUMNS)
    .eq("id", id)
    .single();

  if (currentError || !current) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  // Changing the slug has to rewrite every product that references it. Route it
  // through the SQL function so the section row and the product arrays can never
  // end up out of step, then drop it from the normal update.
  const nextSlug = parsed.row.slug as string | undefined;
  if (nextSlug && nextSlug !== current.slug) {
    const { error: renameError } = await supabase.rpc("admin_rename_section_slug", {
      p_old: current.slug,
      p_new: nextSlug,
    });
    if (renameError) {
      if (renameError.code === "23505") {
        return NextResponse.json({ error: "That URL slug is already taken" }, { status: 409 });
      }
      console.error("[admin/sections] rename failed", renameError);
      return NextResponse.json({ error: "Could not change the URL slug" }, { status: 500 });
    }
  }
  delete parsed.row.slug;

  if (Object.keys(parsed.row).length === 0) {
    const { data: renamed, error: refetchError } = await supabase
      .from("sections")
      .select(SECTION_COLUMNS)
      .eq("id", id)
      .single();
    if (refetchError || !renamed) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }
    return NextResponse.json({ section: toAdminSection(renamed) });
  }

  const { data, error } = await supabase
    .from("sections")
    .update(parsed.row)
    .eq("id", id)
    .select(SECTION_COLUMNS)
    .single();

  if (error) {
    console.error("[admin/sections] update failed", error);
    return NextResponse.json({ error: "Could not save section" }, { status: 500 });
  }
  return NextResponse.json({ section: toAdminSection(data) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const untrusted = requireSameOrigin(req);
  if (untrusted) return untrusted;

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = getAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("sections")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  if (currentError || !current) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  // Strips the slug from every product AND deletes the row, in one transaction,
  // so no kit is left pointing at a section that no longer exists.
  const { error } = await supabase.rpc("admin_delete_section", { p_slug: current.slug });
  if (error) {
    console.error("[admin/sections] delete failed", error);
    return NextResponse.json({ error: "Could not delete section" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
