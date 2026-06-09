import { Header } from "@/components/Header";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { getAllProducts } from "@/lib/supabase/queries";

// Always read live from Supabase so stock/listing changes appear immediately.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getAllProducts();
  return (
    <main>
      <Header />
      <CatalogBrowser products={products} />
    </main>
  );
}
