import { NextResponse, type NextRequest } from "next/server";
import { getAdminClient, removeImageIfUnreferenced } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/ids";
import {
  ADMIN_COLUMNS,
  parseProductBody,
  requireAdmin,
  requireSameOrigin,
  toAdminProduct,
  validatePublishableProduct,
} from "@/lib/admin/server";
import { unknownSectionsError } from "@/lib/admin/sections";
import { purgeCatalog } from "@/lib/cache-tags";

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

  const parsed = parseProductBody(body, { partial: true });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const supabase = getAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("products")
    .select(ADMIN_COLUMNS)
    .eq("id", id)
    .single();
  if (currentError || !current) {
    console.error("[admin/products] load before update failed", currentError);
    return NextResponse.json({ error: "Kit not found" }, { status: 404 });
  }

  const nextState = { ...(current as Record<string, unknown>), ...parsed.row };
  const publishError = validatePublishableProduct(nextState);
  if (publishError) return NextResponse.json({ error: publishError }, { status: 400 });

  const sectionError = await unknownSectionsError(supabase, parsed.row.sections);
  if (sectionError) return NextResponse.json({ error: sectionError }, { status: 400 });

  const { data, error } = await supabase
    .from("products")
    .update(parsed.row)
    .eq("id", id)
    .select(ADMIN_COLUMNS)
    .single();

  if (error) {
    console.error("[admin/products] update failed", error);
    return NextResponse.json({ error: "Could not save kit" }, { status: 500 });
  }

  if (current.image_url && current.image_url !== data.image_url) {
    try {
      await removeImageIfUnreferenced(supabase, current.image_url);
    } catch (cleanupError) {
      console.error("[admin/products] replaced image cleanup failed", cleanupError);
    }
  }
  purgeCatalog();
  return NextResponse.json({ product: toAdminProduct(data) });
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
    .from("products")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();
  if (currentError) {
    console.error("[admin/products] load before delete failed", currentError);
    return NextResponse.json({ error: "Could not delete kit" }, { status: 500 });
  }
  if (!current) return NextResponse.json({ error: "Kit not found" }, { status: 404 });

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("[admin/products] delete failed", error);
    return NextResponse.json({ error: "Could not delete kit" }, { status: 500 });
  }

  if (current.image_url) {
    try {
      await removeImageIfUnreferenced(supabase, current.image_url);
    } catch (cleanupError) {
      console.error("[admin/products] deleted image cleanup failed", cleanupError);
    }
  }
  purgeCatalog();
  return NextResponse.json({ ok: true });
}
