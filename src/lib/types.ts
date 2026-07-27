export interface Product {
  id: string;
  name: string;
  // Display label + search term: a national team ("Argentina") or a club
  // ("Real Madrid"). Grouping lives in `sections`, not here.
  team: string;
  price: number;
  sizes: string[];
  imageUrl: string | null;
  inStock: boolean;
  description: string | null;
  isMystery: boolean;
  // Slugs of the sections this kit appears in. A kit can be in several at once
  // (a club shirt is both a league kit and a Champions League kit).
  sections: string[];
}
