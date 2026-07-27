import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MysteryKits } from "@/components/MysteryKits";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { Footer } from "@/components/Footer";
import { getAllProducts } from "@/lib/supabase/queries";
import { mysteryKits, regularKits } from "@/lib/catalog";

// Always read live from Supabase so stock/listing changes appear immediately.
export const dynamic = "force-dynamic";

// Set per page rather than inherited from the root layout — see the comment in
// src/app/layout.tsx.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const catalog = await getAllProducts();
  if (catalog.status === "unavailable") {
    return (
      <main>
        <Header />
        <section className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gz-red">Temporarily unavailable</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl uppercase text-gz-navy">
            The kit catalog is taking a quick break
          </h1>
          <p className="mt-4 max-w-lg text-gz-body">
            We could not load live stock right now. Please try again shortly or contact us on WhatsApp.
          </p>
        </section>
        <Footer />
      </main>
    );
  }

  const products = catalog.products;
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
