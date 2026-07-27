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
}
