import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { Footer } from "@/components/Footer";
import { getAllProducts } from "@/lib/supabase/queries";

// Always read live from Supabase so stock/listing changes appear immediately.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getAllProducts();
  return (
    <main>
      <Header />
      <Hero />
      <CatalogBrowser products={products} />
      <Footer />
    </main>
  );
}
