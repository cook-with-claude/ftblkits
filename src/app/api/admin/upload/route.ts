import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { KITS_BUCKET, getAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "avif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// Accepts a multipart file upload, stores it in the `kits` bucket, returns its public URL.
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 8 MB)" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const safeExt = ALLOWED_EXT.includes(ext) ? ext : "jpg";
  const path = `${crypto.randomUUID()}.${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = getAdminClient();
  const { error } = await supabase.storage.from(KITS_BUCKET).upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from(KITS_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
