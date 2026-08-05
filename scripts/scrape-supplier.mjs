// Pull this season's kit photos off the supplier's Yupoo album into a folder
// that `npm run import:kit-images` can consume.
//
//   npm run scrape:supplier -- ./photos --dry-run   report what it would take
//   npm run scrape:supplier -- ./photos             download
//   npm run scrape:supplier -- ./photos --unmatched print albums it could not place
//
// Output is `<kit-slug>.jpg` plus a `_manifest.json` recording, for every file,
// the album it came from. A photo that turns out to be wrong is then traceable
// back to a URL instead of being an anonymous JPEG.
//
// Yupoo answers a bare fetch with HTTP 567. A browser User-Agent AND a Referer
// from the album's own host are both required; neither alone is enough. No
// browser automation is involved.
//
// The album's own /search is broken -- it returns the same handful of pinned
// albums for every keyword -- so this walks the root listing instead, which is
// ordered newest-first. That ordering is why it can stop early: once several
// consecutive pages contain nothing for the current season, the rest of the
// album is older stock.

import { mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { KIT_VARIANTS, SEASON_LABEL, kitSlug } from "./catalog-data.mjs";
import { parseTitle } from "./supplier-titles.mjs";

const HOST = "https://jerseyxie.x.yupoo.com";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Referer: `${HOST}/`,
};

const MAX_PAGES = 120;
const STOP_AFTER_EMPTY = 6;
const CONCURRENCY = 4;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const folder = argv.find((a) => !a.startsWith("--"));
const dryRun = flags.has("--dry-run");
const showUnmatched = flags.has("--unmatched");

if (!folder) {
  console.error("Usage: npm run scrape:supplier -- <folder> [--dry-run] [--unmatched]");
  process.exit(1);
}

const decodeEntities = (s) =>
  s
    .replace(/&#x3D;/g, "=")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

// The listing carries everything needed -- title, album id, cover-photo hash and
// photo count -- so the album pages themselves never have to be fetched. That is
// ~2,400 requests saved, and each album holds only a front and a back shot
// anyway, with the cover being the front.
const CARD_RE =
  /class="album__main"\s+title="([^"]*)"\s+href="\/albums\/(\d+)[^"]*"[\s\S]{0,500}?data-src="https:\/\/photo\.yupoo\.com\/([^/"]+)\/([^/"]+)\/[^"]*"[\s\S]{0,300}?album__photonumber">(\d+)</;

function parseCards(html) {
  const cards = [];
  for (const chunk of html.split('class="album__main"').slice(1)) {
    const m = CARD_RE.exec(`class="album__main"${chunk.slice(0, 1500)}`);
    if (m) {
      cards.push({
        title: decodeEntities(m[1]),
        albumId: m[2],
        photoBase: `https://photo.yupoo.com/${m[3]}/${m[4]}`,
        photos: Number(m[5]),
      });
    }
  }
  return cards;
}

async function getPage(page) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${HOST}/categories?page=${page}`, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
}

function detectImage(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

console.log(`Crawling ${HOST} for ${SEASON_LABEL} kits (variants: ${KIT_VARIANTS.join(", ")})\n`);

// Every album that could serve a kit, not just the best one. The supplier
// mislabels often enough -- an album titled "Home" whose photo is a baby
// bodysuit or a kids shirt-and-shorts set -- that a rejected pick needs
// somewhere to fall through to. Rejects are recorded in _rejects.json.
const candidates = new Map(); // "Club|Variant" -> card[]
const skipped = new Map();
const unmatchedTokens = new Map();
let scanned = 0;
let emptyRun = 0;

// Rank candidates for one kit, lowest first. A plain shirt is photographed front
// and back, so exactly two photos ranks first -- more than that usually means a
// set, a kids kit or several colourways sharing an album.
//
// Do NOT add a bonus for albums that name the variant outright. It reads like an
// improvement and measurably is not: this supplier titles the plain adult shirt
// just "26-27 Real Madrid" and spells out "26-27 Real Madrid Home" for the kids
// and baby versions. Preferring the explicit ones swapped six good shirts for
// bodysuits and shirt+shorts sets.
const rank = (card) => Math.abs(card.photos - 2) + (card.photos === 1 ? 1 : 0);

const rejects = (() => {
  try {
    return new Set(JSON.parse(readFileSync(join(resolve(folder), "_rejects.json"), "utf8")).map(String));
  } catch {
    return new Set();
  }
})();
if (rejects.size) console.log(`Ignoring ${rejects.size} album(s) listed in _rejects.json\n`);

for (let page = 1; page <= MAX_PAGES; page++) {
  const html = await getPage(page);
  const cards = parseCards(html);
  if (cards.length === 0) break;
  scanned += cards.length;

  let seasonHits = 0;
  for (const card of cards) {
    const parsed = parseTitle(card.title);
    if (parsed.skip) {
      if (parsed.skip !== "other-season") seasonHits++;
      skipped.set(parsed.skip, (skipped.get(parsed.skip) || 0) + 1);
      if (parsed.skip === "club-not-in-roster") {
        unmatchedTokens.set(parsed.token, (unmatchedTokens.get(parsed.token) || 0) + 1);
      }
      continue;
    }
    seasonHits++;
    if (rejects.has(card.albumId)) continue;
    const key = `${parsed.club}|${parsed.variant}`;
    if (!candidates.has(key)) candidates.set(key, []);
    candidates.get(key).push({ ...card, ...parsed });
  }

  emptyRun = seasonHits === 0 ? emptyRun + 1 : 0;
  process.stdout.write(`\r  page ${page}: ${scanned} albums scanned, ${candidates.size} kits found`);
  if (emptyRun >= STOP_AFTER_EMPTY) break;
}

const chosen = new Map();
for (const [key, list] of candidates) {
  list.sort((a, b) => rank(a) - rank(b));
  chosen.set(key, list[0]);
}

console.log(`\n\nScanned ${scanned} albums.`);
for (const [reason, n] of [...skipped.entries()].sort((a, b) => b[1] - a[1])) {
  if (reason !== "other-season") console.log(`  skipped ${String(n).padStart(4)}  ${reason}`);
}
console.log(`\n${chosen.size} kits matched to the roster.`);

const byVariant = {};
for (const k of chosen.values()) byVariant[k.variant] = (byVariant[k.variant] || 0) + 1;
console.log("  by variant:", byVariant);
console.log("  distinct clubs:", new Set([...chosen.values()].map((k) => k.club)).size);

if (showUnmatched) {
  console.log("\nAlbum names with no roster club (add to CLUB_ALIASES if one is ours):");
  for (const [token, n] of [...unmatchedTokens.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60)) {
    console.log(`  ${String(n).padStart(3)}  ${token}`);
  }
}

if (dryRun) {
  console.log("\nDry run -- nothing downloaded.");
  process.exit(0);
}

const dir = resolve(folder);
mkdirSync(dir, { recursive: true });
const existing = new Set(readdirSync(dir));

const queue = [...chosen.values()];
const manifest = [];
let saved = 0;
let failed = 0;
let skippedExisting = 0;

function record(kit, file) {
  const alternates = (candidates.get(`${kit.club}|${kit.variant}`) ?? [])
    .filter((c) => c.albumId !== kit.albumId)
    .map((c) => ({ albumId: c.albumId, title: c.title, photos: c.photos }));
  manifest.push({
    file,
    club: kit.club,
    variant: kit.variant,
    supplierTitle: kit.title,
    albumId: kit.albumId,
    album: `${HOST}/albums/${kit.albumId}`,
    photo: `${kit.photoBase}/big.jpg`,
    albumPhotoCount: kit.photos,
    // If this photo turns out to be a kids set or a bodysuit, add albumId to
    // _rejects.json, delete the file and re-run: the next-best album is used.
    alternates,
  });
}

async function worker() {
  for (;;) {
    const kit = queue.shift();
    if (!kit) return;
    const slug = kitSlug(kit.club, kit.variant);
    const already = [...existing].find((f) => f.startsWith(`${slug}.`));
    if (already) {
      // Still recorded, so the manifest always describes the whole folder and
      // not just whatever this run happened to download.
      record(kit, already);
      skippedExisting++;
      continue;
    }
    try {
      const res = await fetch(`${kit.photoBase}/big.jpg`, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length > MAX_IMAGE_BYTES) throw new Error(`too large (${buffer.length} bytes)`);
      // The importer and /admin both sniff magic bytes, so a file that would be
      // rejected there is rejected here instead of becoming a broken listing.
      const ext = detectImage(buffer);
      if (!ext) throw new Error("not a recognised image");

      writeFileSync(join(dir, `${slug}.${ext}`), buffer);
      record(kit, `${slug}.${ext}`);
      saved++;
      process.stdout.write(`\r  downloaded ${saved}/${chosen.size}`);
    } catch (err) {
      failed++;
      console.error(`\n  FAILED ${slug}: ${err.message}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

manifest.sort((a, b) => a.file.localeCompare(b.file));
writeFileSync(join(dir, "_manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`\n\nSaved ${saved} photos to ${dir}`);
if (skippedExisting) console.log(`${skippedExisting} already present, left alone.`);
if (failed) console.log(`${failed} failed.`);
console.log("\nNext: review the photos, then");
console.log(`  npm run import:kit-images -- ${folder} --dry-run`);
