import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, detectImage, validateImageUpload } from "@/lib/admin/image";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("image upload validation", () => {
  it("detects a PNG by its bytes", () => {
    expect(detectImage(png)).toEqual({ ext: "png", mime: "image/png" });
  });

  it("accepts matching metadata and contents", () => {
    expect(validateImageUpload({ name: "kit.png", type: "image/png", size: png.length }, png).ok).toBe(true);
  });

  it("rejects forged MIME metadata", () => {
    const result = validateImageUpload({ name: "kit.jpg", type: "image/jpeg", size: png.length }, png);
    expect(result).toEqual({ ok: false, error: "Image type does not match file contents" });
  });

  it("rejects empty and oversized files", () => {
    expect(validateImageUpload({ name: "kit.png", type: "image/png", size: 0 }, Buffer.alloc(0)).ok).toBe(false);
    expect(validateImageUpload({ name: "kit.png", type: "image/png", size: MAX_IMAGE_BYTES + 1 }, png).ok).toBe(false);
  });
});
