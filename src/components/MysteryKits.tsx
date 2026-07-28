import type { Product } from "@/lib/types";
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
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gz-magenta">
              Feeling lucky?
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl uppercase leading-none text-white sm:text-4xl">
              Mystery Kits
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/75">
              Pay less, get surprised. Pick your size — we choose an in-stock replica kit
              and keep the team a surprise until it arrives.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
