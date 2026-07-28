// Bulk-attach kit photos from a folder, matching each file to a kit by name.
//
//   npm run import:kit-images -- ./photos --dry-run   report matches, upload nothing
//   npm run import:kit-images -- ./photos             upload, link and reveal
//   npm run import:kit-images -- ./photos --keep-hidden
//
// A file called `arsenal-home.jpg` finds the "Arsenal Home" kit, uploads to the
// `kits` bucket and fills in image_url. The slug comes from the same
// buildCatalog() the seeder uses, so the two cannot drift apart. Run
// `--list-names` to print every filename the importer is waiting for.
//
// By default a kit is unhidden once it has a photo, since "hidden" only ever
// meant "not presentable yet". Pass --keep-hidden to stage a batch and reveal
// it from /admin instead.
//
// Content is sniffed by magic bytes rather than trusted from the extension --
// the same check /admin applies on upload, so a file that would be rejected
// there is rejected here too instead of becoming a broken listing.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { buildCatalog, slugify } from "./catalog-data.mjs";

const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "avif"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const KITS_BUCKET = "kits";

// Mirrors detectImage() in src/lib/admin/image.ts. Duplicated rather than
// imported because that module is TypeScript behind a "server-only" guard and
// this script runs under bare node.
function detectImage(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
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

function loadEnvLocal() {
  let raw;
  try {
    raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!(match[1] in process.env)) process.env[match[1]] = value;
  }
}

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const folder = argv.find((a) => !a.startsWith("--"));
const dryRun = flags.has("--dry-run");
const keepHidden = flags.has("--keep-hidden");

const catalog = buildCatalog();

if (flags.has("--list-names")) {
  for (const kit of catalog) console.log(`${kit.slug}.jpg`);
  process.exit(0);
}

if (!folder) {
  console.error("Usage: npm run import:kit-images -- <folder> [--dry-run] [--keep-hidden]");
  console.error("       npm run import:kit-images -- --list-names   > expected-filenames.txt");
  process.exit(1);
}

const dir = resolve(folder);
if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
  console.error(`Not a folder: ${dir}`);
  process.exit(1);
}

const bySlug = new Map(catalog.map((kit) => [kit.slug, kit]));

// Photographers and suppliers rarely name files exactly right. Fold the common
// variations -- underscores, spaces, "1st"/"2nd", a trailing "-kit"/"-shirt",
// a "(1)" copy suffix -- before giving up on a file.
function slugFromFilename(file) {
  let stem = basename(file, extname(file));
  stem = stem.replace(/\s*\(\d+\)\s*$/, "");
  let slug = slugify(stem);
  slug = slug.replace(/-(kit|shirt|jersey)$/, "");
  slug = slug.replace(/-1st$/, "-home").replace(/-2nd$/, "-away");
  return slug;
}

const files = readdirSync(dir).filter((f) => ALLOWED_EXT.includes(extname(f).slice(1).toLowerCase()));

const matched = [];
const unmatched = [];
const claimed = new Map();

for (const file of files) {
  const slug = slugFromFilename(file);
  const kit = bySlug.get(slug);
  if (!kit) {
    unmatched.push({ file, slug });
    continue;
  }
  // Two files claiming one kit is a naming mistake, not something to resolve by
  // coin flip -- report both and upload neither.
  if (claimed.has(slug)) {
    unmatched.push({ file, slug, reason: `already claimed by ${claimed.get(slug)}` });
    continue;
  }
  claimed.set(slug, file);
  matched.push({ file, kit });
}

console.log(`${files.length} image files, ${matched.length} matched to kits, ${unmatched.length} unmatched.`);

if (unmatched.length > 0) {
  console.log("\nUnmatched files (no kit has this name):");
  for (const { file, slug, reason } of unmatched.slice(0, 40)) {
    console.log(`  ${file}  ->  ${slug}${reason ? `  (${reason})` : ""}`);
  }
  if (unmatched.length > 40) console.log(`  ... and ${unmatched.length - 40} more`);
}

if (dryRun) {
  console.log("\nDry run -- nothing uploaded.");
  process.exit(0);
}

if (matched.length === 0) process.exit(unmatched.length > 0 ? 1 : 0);

loadEnvLocal();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("\nNEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to upload.");
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: products, error: readError } = await supabase.from("products").select("id, name, team");
if (readError) {
  console.error("Could not read products:", readError.message);
  process.exit(1);
}
const productByKey = new Map(products.map((p) => [`${p.team} ${p.name}`, p]));

let uploaded = 0;
const failures = [];

for (const { file, kit } of matched) {
  const product = productByKey.get(`${kit.team} ${kit.name}`);
  if (!product) {
    failures.push(`${file}: no "${kit.name}" row -- run npm run seed:catalog first`);
    continue;
  }

  const buffer = readFileSync(join(dir, file));
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
    failures.push(`${file}: ${buffer.length === 0 ? "empty" : "larger than 8 MB"}`);
    continue;
  }
  const detected = detectImage(buffer);
  if (!detected) {
    failures.push(`${file}: not a JPEG/PNG/WebP/AVIF despite its extension`);
    continue;
  }

  const path = `${kit.slug}.${detected.ext}`;
  const { error: uploadError } = await supabase.storage
    .from(KITS_BUCKET)
    .upload(path, buffer, { contentType: detected.mime, upsert: true });
  if (uploadError) {
    failures.push(`${file}: upload failed -- ${uploadError.message}`);
    continue;
  }

  const publicUrl = `${url}/storage/v1/object/public/${KITS_BUCKET}/${path}`;
  const patch = keepHidden ? { image_url: publicUrl } : { image_url: publicUrl, hidden: false };
  const { error: updateError } = await supabase.from("products").update(patch).eq("id", product.id);
  if (updateError) {
    failures.push(`${file}: uploaded but could not link -- ${updateError.message}`);
    continue;
  }

  uploaded += 1;
  if (uploaded % 25 === 0) console.log(`  ${uploaded}/${matched.length} uploaded`);
}

console.log(`\n${uploaded} kits now have photos${keepHidden ? "" : " and are live"}.`);

if (failures.length > 0) {
  console.log(`\n${failures.length} failed:`);
  for (const failure of failures) console.log(`  ${failure}`);
}

const { count: stillWaiting } = await supabase
  .from("products")
  .select("id", { count: "exact", head: true })
  .is("image_url", null)
  .eq("is_mystery", false);
console.log(`${stillWaiting ?? 0} kits still have no photo.`);

process.exit(failures.length > 0 ? 1 : 0);
