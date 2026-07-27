import type { Metadata } from "next";
import { CatalogFilters } from "@/components/CatalogFilters";
import { SectionDirectory } from "@/components/SectionDirectory";
import { getAllProducts, getSections } from "@/lib/supabase/queries";
import { regularKits } from "@/lib/catalog";

export const dynamic = "force-dynamic";

// Set per page — the root layout deliberately has no canonical, so that new
// routes don't self-canonicalize to the homepage.
export const metadata: Metadata = {
  title: "All Kits",
  description:
    "Every replica football kit in stock — leagues, clubs, national teams and retro. Order on WhatsApp.",
  alternates: { canonical: "/kits" },
};

export default async function AllKitsPage() {
  const [catalog, sectionsResult] = await Promise.all([getAllProducts(), getSections()]);

  if (catalog.status === "unavailable") {
    throw new Error("The live catalog is temporarily unavailable");
  }

  const products = regularKits(catalog.products);
  const sections = sectionsResult.sections;

  // Counted here rather than per-section-queried: we already hold the full
  // catalog on this page, so this is free.
  const counts = sections.reduce<Record<string, number>>((acc, section) => {
    acc[section.slug] = catalog.products.filter((p) => p.sections.includes(section.slug)).length;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase text-gz-navy sm:text-4xl">
        All Kits
      </h1>
      <div className="mt-1 h-1 w-16 rounded-full gz-flag-gradient" aria-hidden="true" />
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-gz-body">
        Every kit we have in stock. Search by name or team, or jump straight into a section below.
      </p>

      <div className="mt-6">
        <CatalogFilters products={products} />
      </div>

      {sections.length > 0 && (
        <div className="mt-14 border-t border-gz-border pt-12">
          <SectionDirectory sections={sections} counts={counts} />
        </div>
      )}
    </div>
  );
}
