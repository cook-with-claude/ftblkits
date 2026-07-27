import { NextResponse, type NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  ADMIN_COLUMNS,
  parseProductBody,
  requireAdmin,
  requireSameOrigin,
  toAdminProduct,
} from "@/lib/admin/server";
import { unknownSectionsError } from "@/lib/admin/sections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List every product (including hidden / sold-out) for the admin dashboard.
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(ADMIN_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/products] list failed", error);
    return NextResponse.json({ error: "Could not load kits" }, { status: 500 });
  }
  return NextResponse.json({ products: (data ?? []).map(toAdminProduct) });
}

// Create a new kit.
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

  const parsed = parseProductBody(body, { partial: false });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const supabase = getAdminClient();

  // The parser only validates slug *format*; existence needs a query, which is
  // why it lives here and not in the pure parser.
  const sectionError = await unknownSectionsError(supabase, parsed.row.sections);
  if (sectionError) return NextResponse.json({ error: sectionError }, { status: 400 });

  const { data, error } = await supabase
    .from("products")
    .insert(parsed.row)
    .select(ADMIN_COLUMNS)
    .single();

  if (error) {
    console.error("[admin/products] create failed", error);
    return NextResponse.json({ error: "Could not add kit" }, { status: 500 });
  }
  return NextResponse.json({ product: toAdminProduct(data) }, { status: 201 });
}
