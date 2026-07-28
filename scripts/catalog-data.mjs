// The club roster behind `npm run seed:catalog`.
//
// League membership is the 2026/27 season as confirmed in July 2026, taken from
// each competition's season page. It changes every summer: when a club is
// promoted or relegated, edit the list here and re-run the seed. The seeder is
// idempotent, so re-running only adds what is missing -- it never duplicates a
// kit and never overwrites a price, photo or stock flag set from /admin.
//
// UCL_CLUBS / UEL_CLUBS are the confirmed league-phase qualifiers. They are a
// second tag on top of a club's domestic league, because `products.sections` is
// an array -- an Arsenal shirt sits in club-kits, premier-league AND
// champions-league at once.

export const SEASON_SECTION = "26-27-kits";

// Both shirts every club sells. Add "Third" here to widen the whole catalog in
// one edit -- the seeder will pick up the new variant for every club.
export const KIT_VARIANTS = ["Home", "Away"];

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
// has to keep resolving to `brighton-hove-albion-home.jpg` across runs.
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
          name: `${club} ${variant}`,
          team: club,
          slug: `${slugify(club)}-${variant.toLowerCase()}`,
          sections,
          league: league.label,
        });
      }
    }
  }

  return kits;
}
