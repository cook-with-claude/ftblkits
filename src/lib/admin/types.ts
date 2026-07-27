export interface AdminProduct {
  id: string;
  name: string;
  team: string;
  price: number;
  sizes: string[];
  imageUrl: string | null;
  inStock: boolean;
  hidden: boolean;
  isMystery: boolean;
  description: string | null;
  sections: string[];
}

// Unlike the public Section, this carries hidden rows and keeps navGroup as a
// plain string — the DB CHECK is the source of truth, and the admin UI must be
// able to display a value it doesn't recognise rather than crash.
export interface AdminSection {
  id: string;
  slug: string;
  label: string;
  navGroup: string;
  sortOrder: number;
  accent: string | null;
  description: string | null;
  hidden: boolean;
}
