import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { KITS_BUCKET, getAdminClient, kitsStoragePath, removeImageIfUnreferenced } from "@/lib/supabase/admin";
import { requireAdmin, requireSameOrigin } from "@/lib/admin/server";
import { validateImageUpload } from "@/lib/admin/image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accepts a multipart file upload, stores it in the `kits` bucket, returns its public URL.
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const untrusted = requireSameOrigin(req);
  if (untrusted) return untrusted;

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
  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateImageUpload(file, buffer);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const detected = validation.image;

  const path = `${crypto.randomUUID()}.${detected.ext}`;

  const supabase = getAdminClient();
  const { error } = await supabase.storage.from(KITS_BUCKET).upload(path, buffer, {
    contentType: detected.mime,
    upsert: false,
  });
  if (error) {
    console.error("[admin/upload] storage upload failed", error);
    return NextResponse.json({ error: "Could not upload image" }, { status: 500 });
  }

  const { data } = supabase.storage.from(KITS_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}

// Discards an uploaded image that was never attached to a product. Referenced
// images are intentionally left alone so this endpoint cannot break a listing.
export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const untrusted = requireSameOrigin(req);
  if (untrusted) return untrusted;

  let url: unknown;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof url !== "string" || !kitsStoragePath(url)) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  try {
    await removeImageIfUnreferenced(getAdminClient(), url);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/upload] discard failed", error);
    return NextResponse.json({ error: "Could not discard image" }, { status: 500 });
  }
}
