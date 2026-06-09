export type Size = "S" | "M" | "L" | "XL" | "XXL";
export const ALL_SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];

export type KitType = "Home" | "Away" | "Third";

export type ConfederationId =
  | "europe"
  | "south-america"
  | "africa"
  | "asia"
  | "north-america"
  | "oceania";

export interface Confederation {
  id: ConfederationId;
  name: string;
}

export const CONFEDERATIONS: Confederation[] = [
  { id: "europe", name: "Europe" },
  { id: "south-america", name: "South America" },
  { id: "africa", name: "Africa" },
  { id: "asia", name: "Asia" },
  { id: "north-america", name: "North America" },
  { id: "oceania", name: "Oceania" },
];

export interface SizeStock {
  size: Size;
  inStock: boolean;
}

export interface JerseyImage {
  url: string;
  alt: string;
}

export interface Jersey {
  _id: string;
  team: string;
  slug: string;
  kitType: KitType;
  confederation: Confederation;
  price: number;
  photos: JerseyImage[];
  sizes: SizeStock[];
  featured: boolean;
}

export interface SiteSettings {
  whatsappNumber: string; // international digits, e.g. "9613123456"
  orderMessageTemplate: string;
}
