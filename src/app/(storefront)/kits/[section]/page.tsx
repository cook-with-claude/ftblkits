import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CatalogFilters } from "@/components/CatalogFilters";
import { MysteryCard } from "@/components/MysteryCard";
import { getProductsInSection, getSectionBySlug } from "@/lib/supabase/queries";
import { mysteryKits, regularKits } from "@/lib/catalog";
import { MYSTERY_SECTIONS } from "@/lib/mystery";
import { sectionAccent, sectionHref } from "@/lib/sections";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section: slug } = await params;
  const result = await getSectionBySlug(slug);
  if (result.status === "not_found") return { title: "Section not found" };
  if (result.status === "unavailable") return { title: "Catalog temporarily unavailable" };

  const section = result.section;
  return {
    title: section.label,
    description:
      section.description ?? `Replica ${section.label} football kits in Beirut. Order on WhatsApp.`,
    alternates: { canonical: `/kits/${section.slug}` },
  };
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: slug } = await params;

  // Issued together rather than one after the other. The products query is
  // keyed on the slug from the URL, not on anything the section row returns, so
  // there was never a real dependency between them — only a serial await that
  // doubled the page's latency.
  const [sectionResult, catalog] = await Promise.all([
    getSectionBySlug(slug),
    getProductsInSection(slug),
  ]);

  // Hidden sections are unreadable by the public key thanks to RLS, so "hidden"
  // arrives here as not_found without any extra check.
  if (sectionResult.status === "not_found") notFound();
  if (sectionResult.status === "unavailable") {
    throw new Error("The live catalog is temporarily unavailable");
  }
  const section = sectionResult.section;

  if (catalog.status === "unavailable") {
    throw new Error("The live catalog is temporarily unavailable");
  }

  const regular = regularKits(catalog.products);
  const mystery = mysteryKits(catalog.products);
  const accent = sectionAccent(section);
  const mysteryGridClass =
    mystery.length === 1
      ? "mx-auto max-w-sm"
      : mystery.length === 5
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <Link
        href="/kits"
        className="inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-gz-navy transition-colors gz-base ease-gz-out hover:text-gz-red"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All kits
      </Link>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl uppercase text-gz-navy sm:text-4xl">
        {section.label}
      </h1>
      {/* The section accent replaces the shared flag gradient here — a solid bar,
          never a background behind text, so any colour stays legible. */}
      <div className="mt-1 h-1 w-16 rounded-full" style={{ background: accent }} aria-hidden="true" />
      {section.description && (
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-gz-body">{section.description}</p>
      )}

      {section.navGroup === "mystery" && (
        <nav
          className="mt-6 flex gap-2 overflow-x-auto pb-1 gz-no-scrollbar"
          aria-label="Mystery box collections"
        >
          {MYSTERY_SECTIONS.map((item) => {
            const active = item.slug === section.slug;
            return (
              <Link
                key={item.id}
                href={sectionHref(item.slug)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-xs font-extrabold uppercase tracking-wide transition-colors gz-base ease-gz-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy/30 ${
                  active
                    ? "border-gz-navy bg-gz-navy text-white"
                    : "border-gz-border bg-gz-surface text-gz-navy hover:border-gz-navy/35 hover:bg-gz-bg-alt"
                }`}
              >
                {item.slug === "mystery-boxes"
                  ? "All boxes"
                  : item.label.replace(" Mystery Boxes", "")}
              </Link>
            );
          })}
        </nav>
      )}

      {mystery.length > 0 && (
        <div className="relative mt-8 overflow-hidden rounded-[24px] bg-gradient-to-br from-gz-navy-deep via-gz-navy to-[#3a1450] p-4 sm:p-5">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gz-magenta/25 blur-3xl"
            aria-hidden="true"
          />
          <div className={`relative grid gap-4 ${mysteryGridClass}`}>
          {mystery.map((kit) => (
            <MysteryCard key={kit.id} product={kit} headingLevel="h2" />
          ))}
          </div>
          <div className="gz-flagbar absolute inset-x-0 bottom-0 h-1" aria-hidden="true" />
        </div>
      )}

      {regular.length > 0 ? (
        <div className="mt-8">
          <CatalogFilters
            products={regular}
            emptyMessage={`No ${section.label} kits match — try another search.`}
          />
        </div>
      ) : (
        mystery.length === 0 && (
          <p className="mt-8 rounded-xl border border-dashed border-gz-border bg-gz-bg-alt px-4 py-12 text-center text-sm text-gz-muted">
            Nothing in this section yet — check back soon, or{" "}
            <Link href="/kits" className="cursor-pointer font-bold text-gz-red hover:underline">
              browse all kits
            </Link>
            .
          </p>
        )
      )}
    </div>
  );
}
