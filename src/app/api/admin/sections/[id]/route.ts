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
  // end up out of step. Split it from the ordinary patch without mutating the
  // validated parser result; the remainder is applied after a successful rename.
  const { slug: slugPatch, ...remainingPatch } = parsed.row;
  const nextSlug = typeof slugPatch === "string" ? slugPatch : undefined;
  if (nextSlug && nextSlug !== current.slug) {
    const { error: renameError } = await supabase.rpc("admin_rename_section_slug", {
      p_id: id,
      p_old: current.slug,
      p_new: nextSlug,
    });
    if (renameError) {
      if (renameError.code === "23505") {
        return NextResponse.json({ error: "That URL slug is already taken" }, { status: 409 });
      }
      if (renameError.code === "P0002") {
        return NextResponse.json(
          { error: "This section changed in another session — reload and try again" },
          { status: 409 },
        );
      }
      console.error("[admin/sections] rename failed", renameError);
      return NextResponse.json({ error: "Could not change the URL slug" }, { status: 500 });
    }
  }

  if (Object.keys(remainingPatch).length === 0) {
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
    .update(remainingPatch)
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
  // The UUID-addressed RPC deletes the intended row and its trigger strips the
  // slug from every product in the same transaction.
  const { error } = await supabase.rpc("admin_delete_section", { p_id: id });
  if (error) {
    if (error.code === "P0002") {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }
    console.error("[admin/sections] delete failed", error);
    return NextResponse.json({ error: "Could not delete section" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
