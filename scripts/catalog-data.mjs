// The club roster behind `npm run seed:catalog`.
//
// League membership is the 2026/27 season as confirmed in July 2026, taken from
// each competition's season page. It changes every summer: when a club is
// promoted or relegated, edit the list here and re-run the seed. The seeder is
// idempotent, so re-running only adds what is missing -- it never duplicates a
// kit and never overwrites a price, photo or stock flag set from /admin.
//
// The clubs competing in 2026/27, now wearing the 26/27 strips -- the supplier
// restocked in August 2026, so the two dates finally agree. See SEASON_SECTION.
//
// UCL_CLUBS / UEL_CLUBS are the confirmed league-phase qualifiers. They are a
// second tag on top of a club's domestic league, because `products.sections` is
// an array -- an Arsenal shirt sits in club-kits, premier-league AND
// champions-league at once.

// The season the *shirts* belong to. The supplier stocked nothing newer than
// 25/26 until August 2026; it now carries a full 26/27 range, so this catalog
// describes 26/27 goods. The 25/26 kits stay published alongside as their own
// section -- rolling the season adds a season, it does not retire the old one.
//
// To roll this again: bump all three constants together and add a migration
// seeding the new `sections` row (see 20260805..._add_26_27_season.sql). The
// season is part of every kit's name and slug, so a new season inserts
// alongside the old rather than colliding with it.
export const SEASON_SECTION = "26-27-kits";

// The same season in prose, for the per-kit description and the kit name. Kept
// beside the section slug so the two can never disagree -- a listing whose blurb
// says one season while its section says another is a misdescription, not a
// cosmetic slip.
export const SEASON_LABEL = "26/27";

// The season in slug form. Separate from SEASON_LABEL only because a slug
// cannot contain the slash, and both feed the same identity.
export const SEASON_SLUG = "26-27";

// The shirts every club sells. Third and Goalkeeper joined the list when the
// supplier's 26/27 range turned out to carry them; a club with no photo for a
// variant simply keeps that kit hidden, which is what hidden has always meant.
export const KIT_VARIANTS = ["Home", "Away", "Third", "Goalkeeper"];

export const LEAGUES = [
  {
    section: "premier-league",
    label: "Premier League",
    clubs: [
      "Arsenal",
      "Aston Villa",
      "Bournemouth",
      "Brentford",
      "Brighton & Hove Albion",
      "Chelsea",
      "Coventry City",
      "Crystal Palace",
      "Everton",
      "Fulham",
      "Hull City",
      "Ipswich Town",
      "Leeds United",
      "Liverpool",
      "Manchester City",
      "Manchester United",
      "Newcastle United",
      "Nottingham Forest",
      "Sunderland",
      "Tottenham Hotspur",
    ],
  },
  {
    section: "la-liga",
    label: "La Liga",
    clubs: [
      "Alavés",
      "Athletic Bilbao",
      "Atlético Madrid",
      "Barcelona",
      "Celta Vigo",
      "Deportivo La Coruña",
      "Elche",
      "Espanyol",
      "Getafe",
      "Levante",
      "Málaga",
      "Osasuna",
      "Racing Santander",
      "Rayo Vallecano",
      "Real Betis",
      "Real Madrid",
      "Real Sociedad",
      "Sevilla",
      "Valencia",
      "Villarreal",
    ],
  },
  {
    section: "serie-a",
    label: "Serie A",
    clubs: [
      "AC Milan",
      "Atalanta",
      "Bologna",
      "Cagliari",
      "Como",
      "Fiorentina",
      "Frosinone",
      "Genoa",
      "Inter Milan",
      "Juventus",
      "Lazio",
      "Lecce",
      "Monza",
      "Napoli",
      "Parma",
      "Roma",
      "Sassuolo",
      "Torino",
      "Udinese",
      "Venezia",
    ],
  },
  {
    section: "bundesliga",
    label: "Bundesliga",
    clubs: [
      "Augsburg",
      "Bayer Leverkusen",
      "Bayern Munich",
      "Borussia Dortmund",
      "Borussia Mönchengladbach",
      "Eintracht Frankfurt",
      "Elversberg",
      "FC Köln",
      "Freiburg",
      "Hamburger SV",
      "Hoffenheim",
      "Mainz 05",
      "Paderborn",
      "RB Leipzig",
      "Schalke 04",
      "Union Berlin",
      "VfB Stuttgart",
      "Werder Bremen",
    ],
  },
  {
    section: "ligue-1",
    label: "Ligue 1",
    clubs: [
      "Angers",
      "Auxerre",
      "Brest",
      "Le Havre",
      "Le Mans",
      "Lens",
      "Lille",
      "Lorient",
      "Lyon",
      "Marseille",
      "Monaco",
      "Nice",
      "Paris FC",
      "Paris Saint-Germain",
      "Rennes",
      "Strasbourg",
      "Toulouse",
      "Troyes",
    ],
  },
  {
    section: "primeira-liga",
    label: "Primeira Liga",
    clubs: [
      "Académico de Viseu",
      "Alverca",
      "Arouca",
      "Benfica",
      "Braga",
      "Casa Pia",
      "Estoril Praia",
      "Estrela da Amadora",
      "Famalicão",
      "Gil Vicente",
      "Marítimo",
      "Moreirense",
      "Nacional",
      "Porto",
      "Rio Ave",
      "Santa Clara",
      "Sporting CP",
      "Vitória de Guimarães",
    ],
  },
  {
    section: "eredivisie",
    label: "Eredivisie",
    clubs: [
      "ADO Den Haag",
      "AZ",
      "Ajax",
      "Cambuur",
      "Excelsior",
      "Feyenoord",
      "Fortuna Sittard",
      "Go Ahead Eagles",
      "Groningen",
      "Heerenveen",
      "NEC",
      "PEC Zwolle",
      "PSV Eindhoven",
      "Sparta Rotterdam",
      "Telstar",
      "Twente",
      "Utrecht",
      "Willem II",
    ],
  },
  {
    section: "saudi-pro-league",
    label: "Saudi Pro League",
    clubs: [
      "Abha",
      "Al-Ahli",
      "Al-Diriyah",
      "Al-Ettifaq",
      "Al-Faisaly",
      "Al-Fateh",
      "Al-Fayha",
      "Al-Hazem",
      "Al-Hilal",
      "Al-Ittihad",
      "Al-Khaleej",
      "Al-Kholood",
      "Al-Nassr",
      "Al-Qadsiah",
      "Al-Riyadh",
      "Al-Shabab",
      "Al-Taawoun",
      "Neom",
    ],
  },
  {
    section: "mls",
    label: "MLS",
    clubs: [
      "Atlanta United",
      "Austin FC",
      "CF Montréal",
      "Charlotte FC",
      "Chicago Fire",
      "Colorado Rapids",
      "Columbus Crew",
      "D.C. United",
      "FC Cincinnati",
      "FC Dallas",
      "Houston Dynamo",
      "Inter Miami",
      "LA Galaxy",
      "Los Angeles FC",
      "Minnesota United",
      "Nashville SC",
      "New England Revolution",
      "New York City FC",
      "New York Red Bulls",
      "Orlando City",
      "Philadelphia Union",
      "Portland Timbers",
      "Real Salt Lake",
      "San Diego FC",
      "San Jose Earthquakes",
      "Seattle Sounders",
      "Sporting Kansas City",
      "St. Louis City SC",
      "Toronto FC",
      "Vancouver Whitecaps",
    ],
  },
];

// Confirmed 2026/27 league-phase qualifiers from the leagues stocked above.
// Clubs entering through the qualifying rounds are deliberately absent -- tag
// them from /admin once the playoffs settle.
export const UCL_CLUBS = [
  "Arsenal",
  "Aston Villa",
  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Atlético Madrid",
  "Barcelona",
  "Real Betis",
  "Real Madrid",
  "Villarreal",
  "Como",
  "Inter Milan",
  "Napoli",
  "Roma",
  "Bayern Munich",
  "Borussia Dortmund",
  "RB Leipzig",
  "VfB Stuttgart",
  "Lens",
  "Lille",
  "Paris Saint-Germain",
  "Porto",
  "Sporting CP",
  "Feyenoord",
  "PSV Eindhoven",
];

export const UEL_CLUBS = [
  "Bournemouth",
  "Crystal Palace",
  "Sunderland",
  "Celta Vigo",
  "Real Sociedad",
  "AC Milan",
  "Juventus",
  "Bayer Leverkusen",
  "Hoffenheim",
  "Marseille",
  "Rennes",
  "AZ",
];

// Kit photos are matched to kits by filename, so the slug is a contract with
// the image importer, not a cosmetic detail: `Brighton & Hove Albion` + `Home`
// has to keep resolving to `brighton-hove-albion-26-27-home.jpg` across runs.
// Accents are folded rather than dropped so `Alavés` and `Málaga` stay
// typeable on a keyboard that has neither.
export function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " ")
    // Dots close up rather than becoming separators, so `D.C. United` is
    // `dc-united` and not `d-c-united`.
    .replace(/\./g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// The filename contract, in one place. The season is part of the slug so a
// 26/27 shirt cannot overwrite the 25/26 photo already published at
// `arsenal-home.jpg` -- the image importer uploads with upsert:true, so a
// shared slug would silently replace a live listing's photo.
export function kitSlug(club, variant) {
  return `${slugify(club)}-${SEASON_SLUG}-${variant.toLowerCase()}`;
}

// Likewise the kit name carries the season, because the seeder is idempotent on
// (team, name): without it every 26/27 kit would collide with its 25/26
// namesake and be skipped as already-existing.
export function kitName(club, variant) {
  return `${club} ${SEASON_LABEL} ${variant}`;
}

// One flat list of every kit the catalog should contain. Both the seeder and
// the image importer build this, so neither can drift from the other.
export function buildCatalog() {
  const ucl = new Set(UCL_CLUBS);
  const uel = new Set(UEL_CLUBS);
  const kits = [];

  for (const league of LEAGUES) {
    for (const club of league.clubs) {
      const sections = ["club-kits", SEASON_SECTION, league.section];
      if (ucl.has(club)) sections.push("champions-league");
      if (uel.has(club)) sections.push("europa-league");

      for (const variant of KIT_VARIANTS) {
        kits.push({
          name: kitName(club, variant),
          team: club,
          variant,
          slug: kitSlug(club, variant),
          sections,
          league: league.label,
        });
      }
    }
  }

  return kits;
}
