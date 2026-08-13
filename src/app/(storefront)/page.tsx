import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { MysteryKits } from "@/components/MysteryKits";
import { SectionDirectory } from "@/components/SectionDirectory";
import { JerseyCard } from "@/components/JerseyCard";
import { getLatestProducts, getProductsInSection, getSections } from "@/lib/supabase/queries";

// Stock and listing changes still appear immediately: an admin write purges
// CATALOG_TAG, which drops this page's cached HTML along with the data behind
// it. force-dynamic was doing that job by re-rendering for everyone, which is a
// far more expensive way to get the same freshness.
export const revalidate = 300;

// Set per page rather than inherited from the root layout — see the comment in
// src/app/layout.tsx.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  // A landing page, not the catalog. It needs a bounded arrivals rail, the
  // mystery tiers and the section list — everything else is one click away on
  // /kits or a section page, so this no longer pulls the whole catalog.
  const [arrivals, sectionsResult, mysteryResult] = await Promise.all([
    getLatestProducts(8),
    getSections(),
    getProductsInSection("mystery-boxes"),
  ]);

  // Only a full outage gets the fallback; a single failed query still leaves a
  // usable page.
  if (arrivals.status === "unavailable" && sectionsResult.status === "unavailable") {
    return (
      <section className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gz-red">
          Temporarily unavailable
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl uppercase text-gz-navy">
          The kit catalog is taking a quick break
        </h1>
        <p className="mt-4 max-w-lg text-gz-body">
          We could not load live stock right now. Please try again shortly or contact us on WhatsApp.
        </p>
      </section>
    );
  }

  const latest = arrivals.products;
  const sections = sectionsResult.sections;
  const mystery = mysteryResult.products;
  // Feature the newest in-stock kit in the hero (fall back to the newest kit).
  const featured = latest.find((p) => p.inStock) ?? latest[0] ?? null;

  return (
    <>
      <Hero featured={featured} sections={sections} />

      {/* data-reveal is picked up by the single page-wide IntersectionObserver
          in lib/scroll-reveal.ts. Because it is an attribute rather than a
          wrapper component, these stay server components. */}
      {sections.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-14" data-reveal>
          <SectionDirectory sections={sections} />
        </div>
      )}

      <MysteryKits kits={mystery} />

      {latest.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14" data-reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gz-red">
                Freshly stocked
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl uppercase text-gz-navy sm:text-3xl">
                New Arrivals
              </h2>
              <div className="mt-1 h-1 w-16 rounded-full gz-flag-gradient" aria-hidden="true" />
            </div>
            <Link
              href="/kits"
              className="shrink-0 cursor-pointer text-sm font-bold text-gz-navy transition-colors gz-base ease-gz-out hover:text-gz-red"
            >
              View all →
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {latest.map((product) => (
              <JerseyCard key={product.id} product={product} badge="new" />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
