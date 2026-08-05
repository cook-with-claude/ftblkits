// Turning a supplier album title into a kit, kept apart from the crawler so it
// stays pure and unit-testable: no network, no filesystem, no side effects.
//
// The titles look like "26-27 Brighton Away Cheap Soccer Jerseys Yupoo". They
// are written by hand and are unreliable in specific, repeatable ways, which is
// what most of the rules below are defending against.

import { KIT_VARIANTS, LEAGUES, SEASON_SLUG } from "./catalog-data.mjs";

// Anything that is not a plain adult replica shirt. Kids and women's kits use
// different size runs, and tracksuits, jackets and shirt+shorts sets are not the
// product at all -- listing any of them under the S-XXL sizes every kit
// advertises would misdescribe what a buyer receives.
//
// Note the separators: the supplier writes "T-Shirts", "T Shirts" and "Tshirts"
// interchangeably, and a hyphen is not whitespace -- spelling this as
// `t\s*shirts?` let "26-27 Chelsea Soccer T-Shirts" through as a home kit.
export const NOT_A_PLAIN_SHIRT =
  /\b(kids?|player\s*version|player|long[\s-]*sleeve|training|special|wom[ae]n'?s?|suit|shorts?|retro|jackets?|windbreaker|polo|pre-?match|anniversary|concept|vest|hoodie|hoody|pants|sweater|tracksuit|baby|infant|socks|scarf|bag|shoes|boots|cap|hat|t[\s-]*shirts?|souvenn?ir|printed|swear)\b/i;

// Supplier shorthand for a roster club. Lookups are exact on the normalised
// token, never substring: a substring pass silently filed Brazil and Cruz Azul
// under "AZ", Romania under "Roma", Bragantino under "Braga", Rangers under
// "Angers" and Internacional under "Nacional".
export const CLUB_ALIASES = {
  "paris": "Paris Saint-Germain", "psg": "Paris Saint-Germain",
  "man united": "Manchester United", "man utd": "Manchester United",
  "man city": "Manchester City",
  "barc": "Barcelona", "barca": "Barcelona",
  "bayern": "Bayern Munich",
  "dortmund": "Borussia Dortmund",
  "monchengladbach": "Borussia Mönchengladbach", "gladbach": "Borussia Mönchengladbach",
  "leipzig": "RB Leipzig",
  "schalke": "Schalke 04",
  "stuttgart": "VfB Stuttgart",
  "frankfurt": "Eintracht Frankfurt",
  "hamburger": "Hamburger SV", "hamburg": "Hamburger SV",
  "koln": "FC Köln", "kolner": "FC Köln", "cologne": "FC Köln",
  "eindhoven": "PSV Eindhoven", "psv": "PSV Eindhoven",
  "tottenham": "Tottenham Hotspur", "spurs": "Tottenham Hotspur",
  "brighton": "Brighton & Hove Albion",
  "newcastle": "Newcastle United",
  "leeds": "Leeds United",
  "ipswich": "Ipswich Town",
  "celta": "Celta Vigo",
  "deportivo": "Deportivo La Coruña",
  "racing de santander": "Racing Santander",
  "sporting lisbon": "Sporting CP",
  "rennais": "Rennes",
  "montreal": "CF Montréal",
  "charlotte": "Charlotte FC",
  "toronto": "Toronto FC",
  "cincinnati": "FC Cincinnati",
  "dallas": "FC Dallas",
  "seattle": "Seattle Sounders",
  "kansas city": "Sporting Kansas City",
  "portland": "Portland Timbers",
  "philadelphia": "Philadelphia Union",
  "vancouver": "Vancouver Whitecaps",
  "san diego": "San Diego FC",
  "chicago": "Chicago Fire",
  "new york city": "New York City FC",
  "atletico madrid": "Atlético Madrid",
  "athletic": "Athletic Bilbao", "bilbao": "Athletic Bilbao",
  "betis": "Real Betis",
};

export const normalise = (value) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const clubsByToken = new Map();
for (const league of LEAGUES) for (const club of league.clubs) clubsByToken.set(normalise(club), club);
for (const [alias, club] of Object.entries(CLUB_ALIASES)) {
  // An alias pointing at a club that has since left the roster would silently
  // drop photos, so fail loudly rather than skipping it.
  if (!clubsByToken.has(normalise(club))) {
    throw new Error(`CLUB_ALIASES target is not in the roster: ${club}`);
  }
  clubsByToken.set(normalise(alias), club);
}

const VARIANT_WORDS = new Map([
  ["3rd", "Third"],
  ["4th", "Fourth"],
  ["gk", "Goalkeeper"],
  ...KIT_VARIANTS.map((v) => [v.toLowerCase(), v]),
]);
const VARIANT_RE = new RegExp(`\\b(${[...VARIANT_WORDS.keys()].join("|")})\\b`, "i");
const SEASON_RE = new RegExp(`^${SEASON_SLUG}\\b`, "i");

// "26-27 Brighton Away Cheap Soccer Jerseys Yupoo" -> { club, variant }.
// The marketing tail is cut at the first "cheap"/"soccer" because the supplier
// misspells it in several ways ("jer seys", "jerse ys", "Soccer T Shirts"), and
// anything after that word is never part of a club name.
export function parseTitle(title) {
  if (!SEASON_RE.test(title)) return { skip: "other-season" };
  if (NOT_A_PLAIN_SHIRT.test(title)) return { skip: "not-a-plain-shirt" };

  const core = title
    .replace(SEASON_RE, "")
    .replace(/\s*(cheap\s+)?soccer\b.*$/i, "")
    .replace(/\s*cheap\b.*$/i, "")
    .replace(/\s*yupoo\s*$/i, "")
    .replace(/\s*\b(s-?4?xl|size:.*)$/i, "")
    .trim();

  const match = VARIANT_RE.exec(core);
  // An untagged album is the home shirt -- the supplier only ever spells out the
  // variants that differ from it.
  const variant = match ? VARIANT_WORDS.get(match[1].toLowerCase()) : "Home";

  // Removing the variant word leaves the club, and the leftover has to match a
  // roster entry *exactly*. That strictness is the safety net: an unrecognised
  // qualifier stays in the token and fails the lookup, so a "Fourth" or a
  // "Concept" shirt is dropped rather than quietly filed as the home kit.
  const token = normalise(core.replace(VARIANT_RE, " "));
  if (!token) return { skip: "no-club" };

  const club = clubsByToken.get(token);
  if (!club) return { skip: "club-not-in-roster", token };
  if (!KIT_VARIANTS.includes(variant)) return { skip: `variant-not-stocked:${variant}`, token };
  return { club, variant };
}
