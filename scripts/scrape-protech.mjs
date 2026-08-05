// Pull kit photos from the Protech Kit Zone wholesaler into a folder that
// `npm run import:kit-images` can consume.
//
//   npm run scrape:protech -- ./photos-protech --dry-run
//   npm run scrape:protech -- ./photos-protech
//   npm run scrape:protech -- ./photos-protech --unmatched
//
// A second supplier, kept as its own script rather than folded into
// scrape-supplier.mjs: the two sites share nothing but the output contract.
// Where the Yupoo album is hand-titled and unreliable, this is an OpenCart store
// whose product slug states the club, season and variant outright
// (`liverpool-fc-26-27-home-shirt`), so the parsing is far less defensive.
//
// It is the better source for the clubs the Yupoo album is thin on -- Liverpool
// and Juventus have no 26/27 stock there at all.

import { mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { KIT_VARIANTS, SEASON_LABEL, SEASON_SLUG, LEAGUES, kitName, kitSlug } from "./catalog-data.mjs";

const BASE = "https://www.protechkitzone.com/season-26-27-football-shirts/";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
};
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const CONCURRENCY = 4;

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const folder = argv.find((a) => !a.startsWith("--"));
const dryRun = flags.has("--dry-run");
const showUnmatched = flags.has("--unmatched");

if (!folder) {
  console.error("Usage: npm run scrape:protech -- <folder> [--dry-run] [--unmatched]");
  process.exit(1);
}

// Not a plain adult replica. "Player edition" is the authentic on-field cut,
// which is sized differently from the S-XXL replica every listing advertises;
// women's and youth shirts likewise, and a mini kit is a toddler set.
const EXCLUDE = /^(player-edition-|long-sleeve-|mini-kit-|wome-|women-|youth-|kids-)/;

// The store's product slug for a club -> the roster's name for it.
const CLUB_SLUGS = {
  "arsenal": "Arsenal", "chelsea": "Chelsea", "liverpool-fc": "Liverpool",
  "manchester-city": "Manchester City", "manchester-united": "Manchester United",
  "newcastle-united": "Newcastle United", "tottenham-hotspur": "Tottenham Hotspur",
  "aston-villa": "Aston Villa", "everton": "Everton", "leeds-united": "Leeds United",
  "nottingham-forest": "Nottingham Forest", "brighton-hove-albion": "Brighton & Hove Albion",
  "fulham": "Fulham", "brentford": "Brentford", "crystal-palace": "Crystal Palace",
  "sunderland": "Sunderland", "bournemouth": "Bournemouth", "afc-bournemouth": "Bournemouth",
  "fc-barcelona": "Barcelona", "real-madrid": "Real Madrid", "atletico-madrid": "Atlético Madrid",
  "atletico-de-madrid": "Atlético Madrid", "valencia-cf": "Valencia", "sevilla-fc": "Sevilla",
  "real-betis": "Real Betis", "athletic-club": "Athletic Bilbao", "villarreal-cf": "Villarreal",
  "real-sociedad": "Real Sociedad", "celta-vigo": "Celta Vigo", "rc-celta-de-vigo": "Celta Vigo",
  "espanyol": "Espanyol", "rcd-espanyol": "Espanyol", "getafe-cf": "Getafe", "osasuna": "Osasuna",
  "rayo-vallecano": "Rayo Vallecano", "levante-ud": "Levante", "elche-cf": "Elche",
  "juventus": "Juventus", "inter-milan": "Inter Milan", "ac-milan": "AC Milan",
  "as-roma": "Roma", "ssc-napoli": "Napoli", "ss-lazio": "Lazio", "atalanta-bc": "Atalanta",
  "acf-fiorentina": "Fiorentina", "bologna-fc": "Bologna", "torino-fc": "Torino",
  "udinese-calcio": "Udinese", "parma-calcio": "Parma", "genoa-cfc": "Genoa",
  "como-1907": "Como", "cagliari-calcio": "Cagliari", "us-lecce": "Lecce",
  "fc-bayern-munich": "Bayern Munich", "bayern-munich": "Bayern Munich",
  "borussia-dortmund": "Borussia Dortmund", "bayer-04-leverkusen": "Bayer Leverkusen",
  "bayer-leverkusen": "Bayer Leverkusen", "rb-leipzig": "RB Leipzig",
  "eintracht-frankfurt": "Eintracht Frankfurt", "vfb-stuttgart": "VfB Stuttgart",
  "borussia-monchengladbach": "Borussia Mönchengladbach", "werder-bremen": "Werder Bremen",
  "sc-freiburg": "Freiburg", "freiburg": "Freiburg", "fc-schalke-04": "Schalke 04",
  "hamburger-sv": "Hamburger SV", "union-berlin": "Union Berlin", "fc-augsburg": "Augsburg",
  "fc-koln": "FC Köln", "1-fc-koln": "FC Köln", "mainz-05": "Mainz 05",
  "tsg-hoffenheim": "Hoffenheim",
  "paris-saint-germain": "Paris Saint-Germain", "olympique-de-marseille": "Marseille",
  "olympique-lyonnais": "Lyon", "losc-lille": "Lille", "as-monaco": "Monaco",
  "rc-lens": "Lens", "stade-rennais": "Rennes", "ogc-nice": "Nice",
  "rc-strasbourg": "Strasbourg",
  "fc-porto": "Porto", "sl-benfica": "Benfica", "benfica": "Benfica",
  "sporting-cp": "Sporting CP", "sc-braga": "Braga",
  "ajax": "Ajax", "afc-ajax": "Ajax", "psv-eindhoven": "PSV Eindhoven",
  "feyenoord": "Feyenoord", "az-alkmaar": "AZ",
  "al-hilal": "Al-Hilal", "al-hilal-sfc": "Al-Hilal", "al-nassr": "Al-Nassr",
  "al-ittihad": "Al-Ittihad", "al-ahli": "Al-Ahli",
  "inter-miami": "Inter Miami", "inter-miami-cf": "Inter Miami", "la-galaxy": "LA Galaxy",
  "lafc": "Los Angeles FC", "los-angeles-fc": "Los Angeles FC",
};

const roster = new Set(LEAGUES.flatMap((l) => l.clubs));
for (const [slug, club] of Object.entries(CLUB_SLUGS)) {
  if (!roster.has(club)) throw new Error(`CLUB_SLUGS target is not in the roster: ${club} (from ${slug})`);
}

async function get(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

function detectImage(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

// `losc-lille-26-27-home-shirt` -> { club: "Lille", variant: "Home" }.
// A trailing numeric id is one of the store's duplicate listings for the same kit.
export function parseProductSlug(slug) {
  if (EXCLUDE.test(slug)) return { skip: "not-a-plain-adult-shirt" };
  const m = new RegExp(`^(.+?)-${SEASON_SLUG}-(.+?)-shirt(?:-\\d+)?$`).exec(slug);
  if (!m) return { skip: "not-this-season" };
  const [, clubPart, variantPart] = m;

  let variant = null;
  if (/goalkeeper/.test(variantPart)) variant = "Goalkeeper";
  else if (/^third$/.test(variantPart)) variant = "Third";
  else if (/^away$/.test(variantPart)) variant = "Away";
  else if (/^home$/.test(variantPart)) variant = "Home";
  if (!variant || !KIT_VARIANTS.includes(variant)) return { skip: "variant-not-stocked" };

  const club = CLUB_SLUGS[clubPart];
  if (!club) return { skip: "club-not-in-roster", token: clubPart };
  return { club, variant, variantPart };
}

console.log(`Crawling ${BASE} for ${SEASON_LABEL} kits\n`);

const first = await get(BASE);
const lastPage = Math.max(
  ...[...first.matchAll(/\/season-26-27-football-shirts\/page\/(\d+)\//g)].map((m) => Number(m[1])),
  1,
);

const cards = new Map();
for (let page = 1; page <= lastPage; page++) {
  const html = page === 1 ? first : await get(`${BASE}page/${page}/`);
  const body = html.slice(html.indexOf("<body"));
  for (const chunk of body.split(/<div class="product-thumb/).slice(1)) {
    const img = /src="(https:\/\/www\.protechkitzone\.com\/image\/cache\/data\/[^"]+)"/.exec(chunk);
    const link = /href="https:\/\/www\.protechkitzone\.com\/season-26-27-football-shirts\/([^"\/]+)"/.exec(chunk);
    if (img && link && !cards.has(link[1])) cards.set(link[1], img[1]);
  }
  process.stdout.write(`\r  page ${page}/${lastPage}: ${cards.size} products`);
}
console.log("");

const skipped = new Map();
const unmatched = new Map();
const parsed = [];
for (const [slug, img] of cards) {
  const result = parseProductSlug(slug);
  if (result.skip) {
    skipped.set(result.skip, (skipped.get(result.skip) || 0) + 1);
    if (result.token) unmatched.set(result.token, (unmatched.get(result.token) || 0) + 1);
    continue;
  }
  parsed.push({ ...result, slug, img });
}

// One listing per kit. Prefer a clean slug over a duplicate carrying a trailing
// id, and the home goalkeeper shirt over the away one.
const rank = (p) => (/-\d{6,}$/.test(p.slug) ? 2 : 0) + (p.variant === "Goalkeeper" && /^away-/.test(p.variantPart) ? 1 : 0);
const best = new Map();
for (const p of parsed) {
  const key = `${p.club}|${p.variant}`;
  const current = best.get(key);
  if (!current || rank(p) < rank(current)) best.set(key, p);
}
const chosen = [...best.values()];

console.log(`\n${cards.size} products listed.`);
for (const [reason, n] of [...skipped.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  skipped ${String(n).padStart(3)}  ${reason}`);
}
console.log(`\n${chosen.length} kits matched to the roster.`);
console.log("  by variant:", chosen.reduce((a, k) => ((a[k.variant] = (a[k.variant] || 0) + 1), a), {}));
console.log("  distinct clubs:", new Set(chosen.map((k) => k.club)).size);

if (showUnmatched) {
  console.log("\nProduct slugs with no roster club (add to CLUB_SLUGS if ours):");
  [...unmatched.keys()].sort().forEach((t) => console.log(`   ${t}`));
}

if (dryRun) {
  console.log("\nDry run -- nothing downloaded.");
  process.exit(0);
}

const dir = resolve(folder);
mkdirSync(dir, { recursive: true });
const existing = new Set(readdirSync(dir));

const queue = [...chosen];
const manifest = [];
let saved = 0, failed = 0, skippedExisting = 0;

async function worker() {
  for (;;) {
    const kit = queue.shift();
    if (!kit) return;
    const slug = kitSlug(kit.club, kit.variant);
    const already = [...existing].find((f) => f.startsWith(`${slug}.`));
    const record = (file) =>
      manifest.push({
        file,
        club: kit.club,
        variant: kit.variant,
        kitName: kitName(kit.club, kit.variant),
        supplierSlug: kit.slug,
        product: `${BASE}${kit.slug}`,
        photo: kit.img,
      });

    if (already) { record(already); skippedExisting++; continue; }

    try {
      const res = await fetch(kit.img, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length > MAX_IMAGE_BYTES) throw new Error(`too large (${buffer.length} bytes)`);
      const ext = detectImage(buffer);
      if (!ext) throw new Error("not a recognised image");
      writeFileSync(join(dir, `${slug}.${ext}`), buffer);
      record(`${slug}.${ext}`);
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
