export const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "avif"] as const;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export interface DetectedImage {
  ext: "jpg" | "png" | "webp" | "avif";
  mime: (typeof ALLOWED_TYPES)[number];
}

export function detectImage(buffer: Buffer): DetectedImage | null {
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

export function validateImageUpload(
  file: { name: string; type: string; size: number },
  buffer: Buffer,
): { ok: true; image: DetectedImage } | { ok: false; error: string } {
  if (file.size === 0) return { ok: false, error: "Image is empty" };
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image is too large (max 8 MB)" };
  }

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXT.includes(ext as (typeof ALLOWED_EXT)[number])) {
    return { ok: false, error: "Unsupported image type" };
  }
  if (file.type && !ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return { ok: false, error: "Unsupported image type" };
  }

  const detected = detectImage(buffer);
  if (!detected) return { ok: false, error: "Unsupported image type" };
  if (file.type && file.type !== detected.mime) {
    return { ok: false, error: "Image type does not match file contents" };
  }
  if (ext !== detected.ext && !(detected.ext === "jpg" && ext === "jpeg")) {
    return { ok: false, error: "Image extension does not match file contents" };
  }
  return { ok: true, image: detected };
}
