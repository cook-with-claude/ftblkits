import type { Section } from "@/lib/sections";
import type { Product } from "@/lib/types";

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];
const MYSTERY_PRICE = 26.99;

// What a mystery box actually costs against buying the same shirt outright.
// The saving was the entire commercial argument for the tier and it was never
// stated anywhere: "One surprise top-flight club kit" was the complete
// specification of a $26.99 purchase.
const MODERN_KIT_PRICE = 29.99;
const RETRO_KIT_PRICE = 34.99;

export interface MysterySaving {
  /** Dollars off the same shirt bought normally. */
  amount: number;
  /** Rounded percentage, for the themes where it is worth stating. */
  percent: number;
  comparedTo: number;
}

export function mysterySaving(theme: MysteryTheme): MysterySaving {
  const comparedTo = theme === "retro" ? RETRO_KIT_PRICE : MODERN_KIT_PRICE;
  const amount = Math.round((comparedTo - MYSTERY_PRICE) * 100) / 100;
  return { amount, percent: Math.round((amount / comparedTo) * 100), comparedTo };
}

/**
 * The three sentences a $26.99 blind purchase needs: what the pool is, what is
 * promised, and what is ruled out. Stated once, rendered wherever a mystery box
 * is described.
 */
export const MYSTERY_GUARANTEE =
  "Always in the size you pick. If we cannot fill your size from the collection, we message you before anything ships rather than substituting one.";

export const MYSTERY_EXCLUSION =
  "Never a goalkeeper kit — those are a different shirt entirely, and nobody orders a surprise expecting one.";

export function mysteryPoolLine(theme: MysteryTheme): string {
  return theme === "retro"
    ? "Picked from the retro shirts in stock right now — the same 368 classics you can browse under Retro Kits."
    : "Picked from the kits in stock right now, in the collection you chose — the same shirts listed on the site, not overstock or seconds.";
}

export type MysteryTheme =
  | "premier-league"
  | "la-liga"
  | "serie-a"
  | "bundesliga"
  | "ligue-1"
  | "club"
  | "country"
  | "retro";

export interface MysteryProductMeta {
  theme: MysteryTheme;
  shortName: string;
  eyebrow: string;
  promise: string;
  accent: string;
}

const makeMysteryProduct = (
  product: Omit<Product, "price" | "sizes" | "inStock" | "isMystery">,
): Product => ({
  ...product,
  price: MYSTERY_PRICE,
  sizes: [...DEFAULT_SIZES],
  inStock: true,
  isMystery: true,
});

// Mystery products are editorial storefront inventory: fulfillment is selected
// by hand from the live kit catalog, so they do not need one database row per
// theme. Stable UUIDs keep the existing /jersey/[id], cart, and WhatsApp flows
// unchanged while allowing this collection to work when Supabase is unavailable.
export const MYSTERY_PRODUCTS: Product[] = [
  makeMysteryProduct({
    id: "b1000000-0000-4000-8000-000000000001",
    name: "Premier League Mystery Box",
    team: "English Top Flight",
    imageUrl: "/images/mystery/premier-league.webp",
    description:
      "A surprise replica club kit selected from English top-flight styles. Choose your size and leave the club reveal to us.",
    sections: ["mystery-boxes", "league-mystery-boxes", "premier-league"],
  }),
  makeMysteryProduct({
    id: "b1000000-0000-4000-8000-000000000002",
    name: "La Liga Mystery Box",
    team: "Spanish Top Flight",
    imageUrl: "/images/mystery/la-liga.webp",
    description:
      "A surprise replica club kit selected from Spanish top-flight styles. Pick your size and discover the team on delivery.",
    sections: ["mystery-boxes", "league-mystery-boxes", "la-liga"],
  }),
  makeMysteryProduct({
    id: "b1000000-0000-4000-8000-000000000003",
    name: "Serie A Mystery Box",
    team: "Italian Top Flight",
    imageUrl: "/images/mystery/serie-a.webp",
    description:
      "A surprise replica club kit selected from Italian top-flight styles, hand-picked in your chosen size.",
    sections: ["mystery-boxes", "league-mystery-boxes", "serie-a"],
  }),
  makeMysteryProduct({
    id: "b1000000-0000-4000-8000-000000000004",
    name: "Bundesliga Mystery Box",
    team: "German Top Flight",
    imageUrl: "/images/mystery/bundesliga.webp",
    description:
      "A surprise replica club kit selected from German top-flight styles. Choose a size; we choose the shirt.",
    sections: ["mystery-boxes", "league-mystery-boxes", "bundesliga"],
  }),
  makeMysteryProduct({
    id: "b1000000-0000-4000-8000-000000000005",
    name: "Ligue 1 Mystery Box",
    team: "French Top Flight",
    imageUrl: "/images/mystery/ligue-1.webp",
    description:
      "A surprise replica club kit selected from French top-flight styles, packed as a reveal in your chosen size.",
    sections: ["mystery-boxes", "league-mystery-boxes", "ligue-1"],
  }),
  makeMysteryProduct({
    id: "b1000000-0000-4000-8000-000000000006",
    name: "Club Mystery Box",
    team: "Club Collection",
    imageUrl: "/images/mystery/club.webp",
    description:
      "A surprise replica club shirt selected across the leagues we stock. Add a favourite club or colour as an optional request.",
    sections: ["mystery-boxes", "club-mystery-boxes", "club-kits"],
  }),
  makeMysteryProduct({
    id: "b1000000-0000-4000-8000-000000000007",
    name: "National Team Mystery Box",
    team: "International Collection",
    imageUrl: "/images/mystery/country.webp",
    description:
      "A surprise replica national-team kit from our international collection. Choose your size and let the country be the surprise.",
    sections: ["mystery-boxes", "country-mystery-boxes", "national-teams"],
  }),
  makeMysteryProduct({
    id: "b1000000-0000-4000-8000-000000000008",
    name: "Retro Mystery Box",
    team: "Classic Collection",
    imageUrl: "/images/mystery/retro.webp",
    description:
      "A surprise replica shirt inspired by football history and past seasons, selected for collectors who like a throwback.",
    sections: ["mystery-boxes", "retro-mystery-boxes", "retro-kits"],
  }),
];

const META_BY_ID: Record<string, MysteryProductMeta> = {
  "b1000000-0000-4000-8000-000000000001": {
    theme: "premier-league",
    shortName: "Premier League",
    eyebrow: "League Series · England",
    promise: "One surprise top-flight club kit",
    accent: "#a78bfa",
  },
  "b1000000-0000-4000-8000-000000000002": {
    theme: "la-liga",
    shortName: "La Liga",
    eyebrow: "League Series · Spain",
    promise: "One surprise top-flight club kit",
    accent: "#fb923c",
  },
  "b1000000-0000-4000-8000-000000000003": {
    theme: "serie-a",
    shortName: "Serie A",
    eyebrow: "League Series · Italy",
    promise: "One surprise top-flight club kit",
    accent: "#60a5fa",
  },
  "b1000000-0000-4000-8000-000000000004": {
    theme: "bundesliga",
    shortName: "Bundesliga",
    eyebrow: "League Series · Germany",
    promise: "One surprise top-flight club kit",
    accent: "#f87171",
  },
  "b1000000-0000-4000-8000-000000000005": {
    theme: "ligue-1",
    shortName: "Ligue 1",
    eyebrow: "League Series · France",
    promise: "One surprise top-flight club kit",
    accent: "#bef264",
  },
  "b1000000-0000-4000-8000-000000000006": {
    theme: "club",
    shortName: "Club",
    eyebrow: "Open League · Club",
    promise: "One surprise club kit",
    accent: "#f472b6",
  },
  "b1000000-0000-4000-8000-000000000007": {
    theme: "country",
    shortName: "National Team",
    eyebrow: "International Series",
    promise: "One surprise country kit",
    accent: "#fbbf24",
  },
  "b1000000-0000-4000-8000-000000000008": {
    theme: "retro",
    shortName: "Retro",
    eyebrow: "Archive Series",
    promise: "One surprise classic kit",
    accent: "#d6b37a",
  },
};

export const MYSTERY_SECTIONS: Section[] = [
  {
    id: "a1000000-0000-4000-8000-000000000001",
    slug: "mystery-boxes",
    label: "All Mystery Boxes",
    navGroup: "mystery",
    sortOrder: 10,
    accent: "#ec1e5c",
    description: "Every mystery box we run. Pick a size, we pick the kit.",
    hidden: false,
  },
  {
    id: "a1000000-0000-4000-8000-000000000002",
    slug: "league-mystery-boxes",
    label: "League Mystery Boxes",
    navGroup: "mystery",
    sortOrder: 20,
    accent: "#ec1e5c",
    description: "Choose a major league, then leave the club and shirt to us.",
    hidden: false,
  },
  {
    id: "a1000000-0000-4000-8000-000000000003",
    slug: "club-mystery-boxes",
    label: "Club Mystery Boxes",
    navGroup: "mystery",
    sortOrder: 30,
    accent: "#ec1e5c",
    description: "A surprise club shirt selected from across our stocked leagues.",
    hidden: false,
  },
  {
    id: "a1000000-0000-4000-8000-000000000004",
    slug: "country-mystery-boxes",
    label: "Country Mystery Boxes",
    navGroup: "mystery",
    sortOrder: 40,
    accent: "#ec1e5c",
    description: "A surprise national-team kit from our international collection.",
    hidden: false,
  },
  {
    id: "a1000000-0000-4000-8000-000000000005",
    slug: "retro-mystery-boxes",
    label: "Retro Mystery Boxes",
    navGroup: "mystery",
    sortOrder: 50,
    accent: "#ec1e5c",
    description: "A surprise classic-style shirt for collectors and football romantics.",
    hidden: false,
  },
];

export function getMysteryProduct(id: string): Product | null {
  return MYSTERY_PRODUCTS.find((product) => product.id === id) ?? null;
}

export function getMysteryProductsInSection(slug: string): Product[] {
  return MYSTERY_PRODUCTS.filter((product) => product.sections.includes(slug));
}

export function getMysterySection(slug: string): Section | null {
  return MYSTERY_SECTIONS.find((section) => section.slug === slug) ?? null;
}

export function getMysteryProductMeta(product: Pick<Product, "id" | "name">): MysteryProductMeta {
  return (
    META_BY_ID[product.id] ?? {
      theme: "club",
      shortName: product.name.replace(/\s+mystery (box|kit)$/i, ""),
      eyebrow: "Mystery Series",
      promise: "One surprise replica kit",
      accent: "#ec1e5c",
    }
  );
}

export function mysteryKitDescription(product?: Pick<Product, "description">): string {
  return (
    product?.description ??
    "A surprise replica football kit selected from current in-stock styles. Choose your size and we will handle the rest."
  );
}
