// Create the retro catalog from a scraped photo folder's manifest.
//
//   npm run seed:retro -- ./photos-retro --dry-run   list what would be added
//   npm run seed:retro -- ./photos-retro --sql       print the INSERT and exit
//   npm run seed:retro -- ./photos-retro             insert (needs SUPABASE_SERVICE_ROLE_KEY)
//
// Unlike seed-catalog.mjs this is driven by the manifest rather than by a roster
// crossed with variants, because a retro kit only exists if the supplier happens
// to have it -- there is no list of what *should* be there. The manifest is
// therefore the source of truth, and re-running after a re-scrape adds whatever
// is new.
//
// Idempotent on (team, name), same as the season seeder. New kits land hidden;
// the photo import reveals them.

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { RETRO_PRICE, retroSections } from "./retro-data.mjs";

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const folder = argv.find((a) => !a.startsWith("--"));
const dryRun = flags.has("--dry-run");
const sqlOnly = flags.has("--sql");

if (!folder) {
  console.error("Usage: npm run seed:retro -- <folder> [--dry-run] [--sql]");
  process.exit(1);
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

const quote = (value) => `'${String(value).replace(/'/g, "''")}'`;
const pgArray = (values) => `ARRAY[${values.map(quote).join(",")}]::text[]`;

const manifest = JSON.parse(readFileSync(join(resolve(folder), "_manifest.json"), "utf8"));

const kits = manifest.map((row) => ({
  name: row.kitName,
  team: row.team,
  sections: retroSections(row.team, { isNational: row.isNational }),
  description: `${row.team} ${row.season} ${row.variant.toLowerCase()} retro shirt.`,
}));

if (kits.length === 0) {
  console.error("Manifest is empty -- run the scraper first.");
  process.exit(1);
}

function buildInsert(rows) {
  const values = rows.map(
    (kit) =>
      `  (${quote(kit.name)}, ${quote(kit.team)}, ${RETRO_PRICE}, ${pgArray(DEFAULT_SIZES)}, ` +
      `${pgArray(kit.sections)}, ${quote(kit.description)}, true, true)`,
  );
  return (
    "insert into public.products\n" +
    "  (name, team, price, sizes, sections, description, in_stock, hidden)\nvalues\n" +
    values.join(",\n") +
    ";\n"
  );
}

if (sqlOnly) {
  process.stdout.write(buildInsert(kits));
  process.exit(0);
}

console.log(`Manifest describes ${kits.length} retro kits at $${RETRO_PRICE}.`);
const national = kits.filter((k) => k.sections.includes("national-teams")).length;
console.log(`  ${kits.length - national} club, ${national} national-team`);

loadEnvLocal();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("\nNEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  console.error("To apply without credentials, run with --sql and paste the output");
  console.error("into the Supabase SQL editor.");
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: existing, error: readError } = await supabase.from("products").select("name, team");
if (readError) {
  console.error("Could not read existing products:", readError.message);
  process.exit(1);
}

const seen = new Set(existing.map((row) => `${row.team}\0${row.name}`));
const missing = kits.filter((kit) => !seen.has(`${kit.team}\0${kit.name}`));
console.log(`${kits.length - missing.length} already exist; ${missing.length} to add.`);

if (missing.length === 0) process.exit(0);
if (dryRun) {
  for (const kit of missing.slice(0, 40)) console.log(`  ${kit.name}`);
  if (missing.length > 40) console.log(`  ... and ${missing.length - 40} more`);
  console.log("\nDry run -- nothing written.");
  process.exit(0);
}

const CHUNK = 100;
let added = 0;
for (let i = 0; i < missing.length; i += CHUNK) {
  const chunk = missing.slice(i, i + CHUNK);
  const { error } = await supabase.from("products").insert(
    chunk.map((kit) => ({
      name: kit.name,
      team: kit.team,
      price: RETRO_PRICE,
      sizes: DEFAULT_SIZES,
      sections: kit.sections,
      description: kit.description,
      in_stock: true,
      hidden: true,
    })),
  );
  if (error) {
    console.error(`Failed on kits ${i + 1}-${i + chunk.length}:`, error.message);
    console.error(`${added} were added before this. Re-run to resume.`);
    process.exit(1);
  }
  added += chunk.length;
  console.log(`  added ${added}/${missing.length}`);
}

console.log(`\nDone. ${added} retro kits added, all hidden until they have a photo.`);
