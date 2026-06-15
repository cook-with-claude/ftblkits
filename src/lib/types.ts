export interface Product {
  id: string;
  name: string;
  country: string;
  price: number;
  sizes: string[];
  imageUrl: string | null;
  inStock: boolean;
  description: string | null;
  isMystery: boolean;
}
