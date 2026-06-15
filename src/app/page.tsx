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
  return (
    <main>
      <Header />
      <Hero />
      <MysteryKits kits={mystery} />
      <CatalogBrowser products={regular} />
      <Footer />
    </main>
  );
}
