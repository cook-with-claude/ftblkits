import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MysteryKits } from "@/components/MysteryKits";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { Footer } from "@/components/Footer";
import { getAllProducts } from "@/lib/supabase/queries";
import { mysteryKits, regularKits } from "@/lib/catalog";

// Always read live from Supabase so stock/listing changes appear immediately.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getAllProducts();
  const mystery = mysteryKits(products);
  const regular = regularKits(products);
  // Feature the newest in-stock kit in the hero (fall back to the newest kit).
  const featured = regular.find((p) => p.inStock) ?? regular[0] ?? null;
  return (
    <main>
      <Header />
      <Hero featured={featured} />
      <MysteryKits kits={mystery} />
      <CatalogBrowser products={regular} />
      <Footer />
    </main>
  );
}
