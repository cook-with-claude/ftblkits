// Shared vocabulary for the retro catalog.
//
// Retro kits do NOT come from buildCatalog(). That function is a cartesian
// product -- every roster club times every variant, for one current season --
// which is the right shape when you know in advance what should exist. Retro is
// the opposite: it is whatever the supplier happens to have kept, across three
// decades, and a "1997-98 Napoli Home" either exists or it does not. So the
// retro list is *discovered* by the scraper and seeded from its manifest.
//
// What lives here is the vocabulary both halves need: how a retro kit is named
// and slugged, which national teams count, and how to fold the supplier's
// several ways of writing a season into one.

import { slugify } from "./catalog-data.mjs";

export const RETRO_SECTION = "retro-kits";

// Retro pricing carries a premium over a current-season replica.
export const RETRO_PRICE = 34.99;

// A shirt is only retro if it is actually old. The supplier tags plenty of
// recent stock "Retro" -- there are albums titled "25-26 Arsenal Retro" -- and
// putting last season's shirt in a retro section is just wrong. Seasons starting
// 2015 or earlier is the cut: it clears the 2010s classics and excludes anything
// a customer would recognise as current.
export const RETRO_LATEST_START_YEAR = 2015;

// National teams worth stocking, with the storefront country section to tag them
// into where one exists. Countries without a section still get `national-teams`.
export const NATIONAL_TEAMS = {
  Argentina: "argentina",
  Brazil: "brazil",
  England: "england",
  France: "france",
  Germany: "germany",
  Morocco: "morocco",
  Portugal: "portugal",
  Spain: "spain",
  Italy: null,
  Netherlands: null,
  Belgium: null,
  Croatia: null,
  Denmark: null,
  Sweden: null,
  Norway: null,
  Poland: null,
  Russia: null,
  Turkey: null,
  Greece: null,
  Scotland: null,
  Wales: null,
  Ireland: null,
  Austria: null,
  Switzerland: null,
  "Czech Republic": null,
  Romania: null,
  Serbia: null,
  Ukraine: null,
  Mexico: null,
  "United States": null,
  Canada: null,
  Colombia: null,
  Chile: null,
  Uruguay: null,
  Peru: null,
  Ecuador: null,
  Paraguay: null,
  Bolivia: null,
  Venezuela: null,
  "Costa Rica": null,
  Jamaica: null,
  Nigeria: null,
  Cameroon: null,
  Ghana: null,
  Senegal: null,
  "Ivory Coast": null,
  Algeria: null,
  Tunisia: null,
  Egypt: null,
  "South Africa": null,
  Japan: null,
  "South Korea": null,
  China: null,
  Australia: null,
  Iran: null,
  "Saudi Arabia": null,
};

// How the supplier writes each of them. Exact-token lookups only, same rule as
// the club matcher -- substring matching filed Romania under Roma once already.
export const NATIONAL_ALIASES = {
  // Deliberately NOT "america": in this supplier's titles that means Club
  // América, the Mexican club, and mapping it to the USA filed three of their
  // BIMBO/Coca-Cola shirts as United States retro. The genuine ones say "USA"
  // or "United States".
  "usa": "United States", "united states": "United States",
  "korea republic": "South Korea", "south korea": "South Korea", "korea": "South Korea",
  "ivory coast": "Ivory Coast", "cote divoire": "Ivory Coast",
  "czech": "Czech Republic", "czech republic": "Czech Republic",
  "holland": "Netherlands", "netherlands": "Netherlands",
  "republic of ireland": "Ireland", "ireland": "Ireland",
};

// The supplier writes a season as "97-98", "1997-98", "1998" or "2013-14".
// Fold them all to one canonical label so the same shirt is not listed twice.
// Two-digit years 30..99 are 1930s-1990s; 00..29 are 2000s-2020s.
export function normaliseSeason(raw) {
  const value = String(raw).trim();

  let m = /^(\d{4})-(\d{2,4})$/.exec(value);
  if (m) {
    const start = Number(m[1]);
    const end = m[2].length === 4 ? Number(m[2]) : Math.floor(start / 100) * 100 + Number(m[2]);
    return { label: `${start}/${String(end % 100).padStart(2, "0")}`, startYear: start };
  }

  m = /^(\d{2})-(\d{2})$/.exec(value);
  if (m) {
    const start = Number(m[1]) >= 30 ? 1900 + Number(m[1]) : 2000 + Number(m[1]);
    return { label: `${start}/${m[2]}`, startYear: start };
  }

  m = /^(\d{4})$/.exec(value);
  if (m) return { label: m[1], startYear: Number(m[1]) };

  return null;
}

// A club cannot have a retro shirt from before it existed. The supplier titled
// an Inter Milan shirt "94-95 Inter Miami" -- a club founded in 2018 -- and
// without this the mislabelling sails straight through. Only the clubs young
// enough for it to matter are listed; anything older than its own founding is a
// mislabel, not a rarity.
export const FOUNDED = {
  "Inter Miami": 2018,
  "Charlotte FC": 2019,
  "Austin FC": 2018,
  "Nashville SC": 2016,
  "St. Louis City SC": 2019,
  "San Diego FC": 2023,
  "Los Angeles FC": 2014,
  "Atlanta United": 2014,
  "Minnesota United": 2015,
  Neom: 2023,
  "Al-Kholood": 2023,
  "Al-Diriyah": 2011,
};

export function isPlausibleEra(team, startYear) {
  const founded = FOUNDED[team];
  return founded === undefined || startYear >= founded;
}

// "Napoli" + "1997/98" + "Home" -> "Napoli 1997/98 Home".
export function retroKitName(team, seasonLabel, variant) {
  return `${team} ${seasonLabel} ${variant}`;
}

// The filename contract, as with the current season. The season is slashless and
// the `-retro` suffix keeps a retro shirt from ever colliding with a
// current-season slug for the same club and variant.
export function retroKitSlug(team, seasonLabel, variant) {
  return `${slugify(team)}-${seasonLabel.replace("/", "-")}-${variant.toLowerCase()}-retro`;
}

// Every retro kit sits in retro-kits, plus club-kits or national-teams, plus the
// country section when the storefront has one.
export function retroSections(team, { isNational }) {
  const sections = [RETRO_SECTION];
  if (isNational) {
    sections.push("national-teams");
    const country = NATIONAL_TEAMS[team];
    if (country) sections.push(country);
  } else {
    sections.push("club-kits");
  }
  return sections;
}
