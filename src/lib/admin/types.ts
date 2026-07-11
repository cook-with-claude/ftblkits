export interface AdminProduct {
  id: string;
  name: string;
  country: string;
  price: number;
  sizes: string[];
  imageUrl: string | null;
  inStock: boolean;
  hidden: boolean;
  isMystery: boolean;
  description: string | null;
}
