import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gz-navy-deep to-gz-navy px-6 py-12 sm:px-12 sm:py-16">
        {/* Soft accent glows */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gz-red/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-gz-green/30 blur-3xl" aria-hidden="true" />

        <div className="relative max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/70">
            FIFA World Cup 2026 · USA · Canada · México
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl uppercase leading-[0.95] text-white sm:text-6xl">
            Wear the
            <br />
            tournament.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">
            Replica national-team kits in Beirut. Browse the collection, pick your size,
            and order in seconds on WhatsApp.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#catalog"
              className="cursor-pointer rounded-full bg-gz-red px-7 py-3 text-base font-extrabold uppercase tracking-wide text-white transition-transform duration-200 hover:scale-[1.03]"
            >
              Shop the kits
            </Link>
            <Link
              href="#countries"
              className="cursor-pointer rounded-full border border-white/30 px-7 py-3 text-base font-extrabold uppercase tracking-wide text-white transition-colors duration-200 hover:bg-white/10"
            >
              Shop by country
            </Link>
          </div>

          <Link
            href="#mystery"
            className="group mt-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-bold text-gz-magenta transition-colors duration-200 hover:text-white"
          >
            Feeling lucky? Try a Mystery Kit
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Tri-color motif */}
        <div className="gz-flagbar absolute inset-x-0 bottom-0 h-1.5" aria-hidden="true" />
      </div>
    </section>
  );
}
