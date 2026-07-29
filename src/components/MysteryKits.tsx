import Link from "next/link";
import type { Product } from "@/lib/types";
import { MYSTERY_SECTIONS } from "@/lib/mystery";
import { sectionHref } from "@/lib/sections";
import { MysteryCard } from "./MysteryCard";

// The Mystery Kits feature band — a dark navy→magenta panel (deliberately breaking from
// the white catalog to signal "something special") holding the tier cards.
export function MysteryKits({ kits }: { kits: Product[] }) {
  if (kits.length === 0) return null;

  return (
    <section className="pt-14">
      <div className="mx-auto max-w-6xl px-4" data-reveal>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gz-navy-deep via-gz-navy to-[#3a1450] px-6 py-10 sm:px-10 sm:py-12">
          {/* Accent glows */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gz-magenta/30 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-gz-red/25 blur-3xl" aria-hidden="true" />

          <div className="relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gz-magenta">
                  Pick the theme. Keep the team secret.
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl uppercase leading-none text-white sm:text-4xl">
                  Mystery Kits
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
                  Eight ways to be surprised. Choose a league or collection and your size —
                  we hand-pick one in-stock replica kit for the reveal.
                </p>
              </div>
              <Link
                href="/kits/mystery-boxes"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-white/30 px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white transition-colors gz-base ease-gz-out hover:border-white hover:bg-white hover:text-gz-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Explore all →
              </Link>
            </div>

            <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 gz-no-scrollbar" aria-label="Mystery kit collections">
              {MYSTERY_SECTIONS.slice(1).map((section) => (
                <Link
                  key={section.id}
                  href={sectionHref(section.slug)}
                  className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-white/15 bg-white/[0.06] px-4 text-xs font-extrabold uppercase tracking-wide text-white/80 transition-colors gz-base ease-gz-out hover:border-gz-magenta hover:bg-gz-magenta/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {section.label.replace(" Mystery Boxes", "")}
                </Link>
              ))}
            </nav>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kits.map((kit) => (
                <MysteryCard key={kit.id} product={kit} />
              ))}
            </div>
          </div>

          {/* Tri-color motif */}
          <div className="gz-flagbar absolute inset-x-0 bottom-0 h-1.5" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
