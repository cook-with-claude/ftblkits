import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";

const TRUST = [
  { label: "Cash on delivery", color: "bg-gz-green" },
  { label: "Lebanon-wide shipping", color: "bg-gz-red" },
  { label: "WhatsApp support", color: "bg-gz-whatsapp" },
];

export function Hero({ featured }: { featured: Product | null }) {
  return (
    <section className="relative overflow-hidden bg-gz-navy-deep text-white">
      {/* Giant tournament-year watermark */}
      <span
        className="pointer-events-none absolute -top-[10%] right-[-1%] select-none font-[family-name:var(--font-display)] leading-[0.8] text-white/[0.04]"
        style={{ fontSize: "min(48vw, 600px)" }}
        aria-hidden="true"
      >
        26
      </span>
      {/* Accent glows */}
      <div className="pointer-events-none absolute -right-20 -top-16 h-80 w-80 rounded-full bg-gz-red/25 blur-[95px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-gz-green/20 blur-[95px]" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="grid items-center gap-11 md:grid-cols-[1.06fr_0.94fr]">
          {/* Copy */}
          <div>
            <p className="gz-rise text-xs font-extrabold uppercase tracking-[0.22em] text-white/65">
              FIFA World Cup 2026 · USA · Canada · México
            </p>
            <h1 className="gz-rise mt-4 font-[family-name:var(--font-display)] text-5xl uppercase leading-[0.9] tracking-wide sm:text-7xl">
              Wear the
              <br />
              tournament<span className="text-gz-red">.</span>
            </h1>
            <p className="gz-rise mt-5 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
              Replica national-team kits in Beirut. Browse the collection, pick your size,
              and order in seconds on WhatsApp.
            </p>

            <div className="gz-rise mt-8 flex flex-wrap gap-3">
              <Link
                href="#catalog"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gz-red px-7 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-12px_rgba(225,6,0,0.7)]"
              >
                Shop the kits →
              </Link>
              <Link
                href="#countries"
                className="inline-flex cursor-pointer items-center rounded-full border border-white/30 px-7 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white transition-colors duration-200 hover:bg-white/10"
              >
                Shop by country
              </Link>
            </div>

            <div className="gz-rise mt-8 flex flex-wrap gap-x-6 gap-y-3.5">
              {TRUST.map((t) => (
                <span key={t.label} className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/75">
                  <span className={`h-[7px] w-[7px] rounded-full ${t.color}`} aria-hidden="true" />
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Featured kit */}
          {featured && (
            <div className="relative">
              <div className="relative mx-auto max-w-[360px]">
                <div className="gz-float-lg relative aspect-[4/5] overflow-hidden rounded-3xl bg-gz-navy shadow-[0_44px_80px_-28px_rgba(0,0,0,0.75)]">
                  {featured.imageUrl && (
                    <Image
                      src={featured.imageUrl}
                      alt={featured.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 360px"
                      className="object-cover"
                      priority
                    />
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-gz-navy-deep/45 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white backdrop-blur-sm">
                    Featured
                  </span>
                </div>

                <Link
                  href={`/jersey/${featured.id}`}
                  className="absolute -right-2 bottom-6 flex cursor-pointer items-center gap-4 rounded-[18px] bg-white px-4 py-3 text-gz-navy-deep shadow-[0_24px_44px_-16px_rgba(0,0,0,0.55)] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-gz-red">
                      {featured.country}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-display)] text-[15px] uppercase leading-none">
                      {featured.name}
                    </p>
                  </div>
                  <span className="font-[family-name:var(--font-display)] text-2xl leading-none">
                    ${featured.price}
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tri-color motif */}
      <div className="gz-flagbar h-1" aria-hidden="true" />
    </section>
  );
}
