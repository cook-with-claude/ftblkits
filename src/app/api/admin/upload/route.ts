import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { KITS_BUCKET, getAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "avif"];
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

interface DetectedImage {
  ext: "jpg" | "png" | "webp" | "avif";
  mime: (typeof ALLOWED_TYPES)[number];
}

function detectImage(buffer: Buffer): DetectedImage | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  if (
    buffer.length >= 16 &&
    buffer.subarray(4, 8).toString("ascii") === "ftyp" &&
    buffer.subarray(8, Math.min(buffer.length, 32)).toString("ascii").includes("avif")
  ) {
    return { ext: "avif", mime: "image/avif" };
  }
  return null;
}

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
  if (file.size === 0) {
    return NextResponse.json({ error: "Image is empty" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 8 MB)" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXT.includes(ext) || (file.type && !ALLOWED_TYPES.includes(file.type))) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectImage(buffer);
  if (!detected) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }
  if (file.type && file.type !== detected.mime) {
    return NextResponse.json({ error: "Image type does not match file contents" }, { status: 400 });
  }
  if (ext !== detected.ext && !(detected.ext === "jpg" && ext === "jpeg")) {
    return NextResponse.json({ error: "Image extension does not match file contents" }, { status: 400 });
  }

  const path = `${crypto.randomUUID()}.${detected.ext}`;

  const supabase = getAdminClient();
  const { error } = await supabase.storage.from(KITS_BUCKET).upload(path, buffer, {
    contentType: detected.mime,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from(KITS_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
