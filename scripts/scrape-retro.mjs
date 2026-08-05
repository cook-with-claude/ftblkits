// Pull retro kit photos from the supplier's Yupoo album.
//
//   npm run scrape:retro -- ./photos-retro --dry-run
//   npm run scrape:retro -- ./photos-retro
//   npm run scrape:retro -- ./photos-retro --per-team 3
//   npm run scrape:retro -- ./photos-retro --unmatched
//
// Separate from scrape-supplier.mjs because it is a different question. That one
// asks "which of the kits I already know should exist can I find photos for";
// this one asks "what retro stock is there at all", and the answer defines the
// catalog rather than filling it in. Output is the same folder-plus-manifest
// contract, and `_rejects.json` works identically.
//
// The whole album has to be walked -- retro is scattered across every page of a
// 250-page listing rather than sitting at the front like the current season.

import { mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { LEAGUES } from "./catalog-data.mjs";
import { CLUB_ALIASES, normalise } from "./supplier-titles.mjs";
import {
  NATIONAL_ALIASES,
  NATIONAL_TEAMS,
  RETRO_LATEST_START_YEAR,
  isPlausibleEra,
  normaliseSeason,
  retroKitName,
  retroKitSlug,
} from "./retro-data.mjs";

const HOST = "https://jerseyxie.x.yupoo.com";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Referer: `${HOST}/`,
};
const MAX_PAGES = 400;
const CONCURRENCY = 4;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const positional = argv.filter((a) => !a.startsWith("--"));
const folder = positional[0];
const perTeamArg = argv.indexOf("--per-team");
const PER_TEAM = perTeamArg >= 0 ? Number(argv[perTeamArg + 1]) : 5;
const dryRun = flags.has("--dry-run");
const showUnmatched = flags.has("--unmatched");

if (!folder) {
  console.error("Usage: npm run scrape:retro -- <folder> [--dry-run] [--per-team N] [--unmatched]");
  process.exit(1);
}

// Same disqualifiers as the current-season scrape, minus "retro" and "special":
// here "retro" is the thing being looked for, and a retro shirt is often a
// one-off commemorative by nature.
const NOT_A_PLAIN_SHIRT =
  /\b(kids?|player\s*version|player|long[\s-]*sleeve|training|wom[ae]n'?s?|suit|shorts?|jackets?|windbreaker|polo|pre-?match|vest|hoodie|hoody|pants|sweater|tracksuit|baby|infant|socks|scarf|bag|shoes|boots|cap|hat|t[\s-]*shirts?|souvenn?ir|printed)\b/i;

const VARIANT_RE = /\b(home|away|third|3rd|goalkeeper|gk)\b/i;

const teamsByToken = new Map();
for (const league of LEAGUES) for (const club of league.clubs) teamsByToken.set(normalise(club), { team: club, isNational: false });
for (const [alias, club] of Object.entries(CLUB_ALIASES)) teamsByToken.set(normalise(alias), { team: club, isNational: false });
for (const country of Object.keys(NATIONAL_TEAMS)) teamsByToken.set(normalise(country), { team: country, isNational: true });
for (const [alias, country] of Object.entries(NATIONAL_ALIASES)) {
  if (!(country in NATIONAL_TEAMS)) throw new Error(`NATIONAL_ALIASES target is not a known team: ${country}`);
  teamsByToken.set(normalise(alias), { team: country, isNational: true });
}
// The supplier sprinkles stray spaces through names -- "M anchester U nited"
// appears 76 times. Collapsing spaces entirely recovers those without loosening
// the exact-token rule that keeps Romania out of Roma.
const teamsDespaced = new Map([...teamsByToken].map(([k, v]) => [k.replace(/ /g, ""), v]));

const decodeEntities = (s) =>
  s.replace(/&#x3D;/g, "=").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

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

export function parseRetroTitle(title) {
  if (!/\bretro\b/i.test(title)) return { skip: "not-retro" };
  if (NOT_A_PLAIN_SHIRT.test(title)) return { skip: "not-a-plain-shirt" };

  const seasonMatch = /^(\d{2}-\d{2}|\d{4}(?:-\d{2,4})?)\b/.exec(title.trim());
  if (!seasonMatch) return { skip: "no-season" };
  const season = normaliseSeason(seasonMatch[1]);
  if (!season) return { skip: "unparsable-season" };
  // "25-26 Arsenal Retro" is not a retro shirt, whatever the album says.
  if (season.startYear > RETRO_LATEST_START_YEAR) return { skip: "too-recent" };

  const core = title
    .replace(/^(\d{2}-\d{2}|\d{4}(?:-\d{2,4})?)\s*/, "")
    .replace(/\s*(cheap\s+)?soccer\b.*$/i, "")
    .replace(/\s*retro\b.*$/i, "")
    .replace(/\s*yupoo\s*$/i, "")
    .trim();

  const vm = VARIANT_RE.exec(core);
  const variant = vm
    ? /(3rd|third)/i.test(vm[1])
      ? "Third"
      : /(gk|goalkeeper)/i.test(vm[1])
        ? "Goalkeeper"
        : `${vm[1][0].toUpperCase()}${vm[1].slice(1).toLowerCase()}`
    : "Home";

  const token = normalise(core.replace(VARIANT_RE, " "));
  if (!token) return { skip: "no-team" };
  const found = teamsByToken.get(token) ?? teamsDespaced.get(token.replace(/ /g, ""));
  if (!found) return { skip: "team-not-stocked", token };
  if (!isPlausibleEra(found.team, season.startYear)) return { skip: "older-than-the-club", token };

  return { ...found, variant, season: season.label, startYear: season.startYear };
}

function detectImage(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

async function getPage(page) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${HOST}/categories?page=${page}`, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

const dir = resolve(folder);
const rejects = (() => {
  try {
    return new Set(JSON.parse(readFileSync(join(dir, "_rejects.json"), "utf8")).map(String));
  } catch {
    return new Set();
  }
})();
if (rejects.size) console.log(`Ignoring ${rejects.size} album(s) listed in _rejects.json\n`);

console.log(`Crawling ${HOST} for retro kits (up to ${PER_TEAM} per team)\n`);

const candidates = new Map(); // "Team|Season|Variant" -> card[]
const skipped = new Map();
const unmatched = new Map();
let scanned = 0;

for (let page = 1; page <= MAX_PAGES; page++) {
  const html = await getPage(page);
  const cards = parseCards(html);
  if (cards.length === 0) break;
  scanned += cards.length;

  for (const card of cards) {
    const parsed = parseRetroTitle(card.title);
    if (parsed.skip) {
      skipped.set(parsed.skip, (skipped.get(parsed.skip) || 0) + 1);
      if (parsed.token) unmatched.set(parsed.token, (unmatched.get(parsed.token) || 0) + 1);
      continue;
    }
    if (rejects.has(card.albumId)) continue;
    const key = `${parsed.team}|${parsed.season}|${parsed.variant}`;
    if (!candidates.has(key)) candidates.set(key, []);
    candidates.get(key).push({ ...card, ...parsed });
  }
  // Every 10 pages rather than every page: this crawl is ~250 pages, and a
  // carriage-return progress line turns into 250 lines of noise the moment the
  // output is piped anywhere.
  if (page % 10 === 0 || page === 1) {
    process.stdout.write(`\r  page ${page}: ${scanned} albums, ${candidates.size} retro kits   `);
  }
}
console.log("");

// A plain shirt is shot front and back, so two photos ranks first. More usually
// means a set or several colourways sharing an album.
const rank = (card) => Math.abs(card.photos - 2) + (card.photos === 1 ? 1 : 0);
const bySlot = new Map();
for (const [key, list] of candidates) {
  list.sort((a, b) => rank(a) - rank(b));
  bySlot.set(key, list[0]);
}

// Newest era first within a team: those are the shirts people recognise.
const byTeam = new Map();
for (const kit of bySlot.values()) {
  if (!byTeam.has(kit.team)) byTeam.set(kit.team, []);
  byTeam.get(kit.team).push(kit);
}
const chosen = [];
for (const [, list] of byTeam) {
  list.sort((a, b) => b.startYear - a.startYear);
  chosen.push(...list.slice(0, PER_TEAM));
}

console.log(`\nScanned ${scanned} albums.`);
for (const [reason, n] of [...skipped.entries()].sort((a, b) => b[1] - a[1])) {
  if (reason !== "not-retro") console.log(`  skipped ${String(n).padStart(4)}  ${reason}`);
}
console.log(`\n${bySlot.size} distinct retro kits found; keeping ${chosen.length} at ${PER_TEAM} per team.`);
console.log(`  teams: ${byTeam.size} (${[...byTeam.values()].filter((l) => l[0].isNational).length} national)`);
console.log("  by variant:", chosen.reduce((a, k) => ((a[k.variant] = (a[k.variant] || 0) + 1), a), {}));

if (showUnmatched) {
  console.log("\nTeam names with no match (add to the roster or NATIONAL_TEAMS if wanted):");
  [...unmatched.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60).forEach(([t, n]) => console.log(`  ${String(n).padStart(4)}  ${t}`));
}

if (dryRun) {
  console.log("\nDry run -- nothing downloaded.");
  process.exit(0);
}

mkdirSync(dir, { recursive: true });
const existing = new Set(readdirSync(dir));
const queue = [...chosen];
const manifest = [];
let saved = 0, failed = 0, skippedExisting = 0;

function record(kit, file) {
  manifest.push({
    file,
    team: kit.team,
    isNational: kit.isNational,
    season: kit.season,
    variant: kit.variant,
    kitName: retroKitName(kit.team, kit.season, kit.variant),
    supplierTitle: kit.title,
    albumId: kit.albumId,
    album: `${HOST}/albums/${kit.albumId}`,
    photo: `${kit.photoBase}/big.jpg`,
    albumPhotoCount: kit.photos,
    alternates: (candidates.get(`${kit.team}|${kit.season}|${kit.variant}`) ?? [])
      .filter((c) => c.albumId !== kit.albumId)
      .map((c) => ({ albumId: c.albumId, title: c.title, photos: c.photos })),
  });
}

async function worker() {
  for (;;) {
    const kit = queue.shift();
    if (!kit) return;
    const slug = retroKitSlug(kit.team, kit.season, kit.variant);
    const already = [...existing].find((f) => f.startsWith(`${slug}.`));
    if (already) { record(kit, already); skippedExisting++; continue; }
    try {
      const res = await fetch(`${kit.photoBase}/big.jpg`, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length > MAX_IMAGE_BYTES) throw new Error(`too large (${buffer.length} bytes)`);
      const ext = detectImage(buffer);
      if (!ext) throw new Error("not a recognised image");
      writeFileSync(join(dir, `${slug}.${ext}`), buffer);
      record(kit, `${slug}.${ext}`);
      saved++;
      process.stdout.write(`\r  downloaded ${saved}/${chosen.length}`);
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
