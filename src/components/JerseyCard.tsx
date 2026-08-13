"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { isSoldOut } from "@/lib/catalog";

// Home / Away label derived from the kit name — shown as the top-left badge.
function kitKind(name: string): string | null {
  if (/\baway\b/i.test(name)) return "Away";
  if (/\bhome\b/i.test(name)) return "Home";
  return null;
}

export function JerseyCard({
  product,
  badge,
  headingLevel = "h3",
}: {
  product: Product;
  badge?: "new";
  headingLevel?: "h2" | "h3";
}) {
  const soldOut = isSoldOut(product);
  const kind = kitKind(product.name);
  const Heading = headingLevel;

  return (
    // One hover used to fire four durations across three easings — 300ms lift,
    // 300ms overlay, 500ms zoom, 950ms sheen — which is most of why the cards
    // felt unsettled. Now the container effects share gz-slow and only the
    // image deliberately trails behind it.
    // transition-[...] rather than transition-all, which also animates
    // properties nothing here intends to change. `translate` has to be listed
    // explicitly: Tailwind v4 compiles -translate-y-* to the standalone
    // `translate` property, not to `transform`, so a list naming only
    // `transform` silently leaves the lift un-animated.
    <div className="gz-card group relative overflow-hidden rounded-2xl border border-gz-border bg-gz-surface transition-[transform,translate,box-shadow,border-color] gz-slow ease-gz-out hover:-translate-y-1.5 hover:border-gz-navy/30 hover:shadow-xl hover:shadow-gz-navy/15 focus-within:-translate-y-1.5 focus-within:border-gz-navy/30 focus-within:shadow-xl focus-within:shadow-gz-navy/15 active:translate-y-0 active:gz-fast">
      {/* prefetch was set nowhere in the repo, so every card in a 687-card grid
          queued a route prefetch as it entered the viewport. The ~42 category
          links keep theirs — there are few of them and they are the likely next
          click; a product card is one of hundreds and mostly is not. */}
      <Link
        href={`/jersey/${product.id}`}
        prefetch={false}
        className="block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gz-navy"
      >
      <div className="relative aspect-square overflow-hidden bg-gz-navy-deep">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            // Must track the grid: 2 columns, then 3 at sm, then 4 at lg. The
            // middle step was missing, so between 640px and 1024px the browser
            // was told 25vw while each card actually renders at about 33vw and
            // it fetched an image a third too small to be sharp.
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="gz-card-img object-cover transition-transform gz-slower ease-gz-out"
          />
        )}

        {/* Light sweep on hover */}
        <div
          className="gz-sheen pointer-events-none absolute inset-y-0 left-0 w-[45%] -translate-x-[160%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/45 to-transparent"
          aria-hidden="true"
        />

        {/* Top-left badge: New (arrivals) or Home/Away */}
        {badge === "new" ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-gz-navy">
            New
          </span>
        ) : (
          kind && (
            // /45 over an arbitrary kit photo is not a scrim, it is a tint —
            // white on a pale shirt fell well under the contrast floor. /90
            // matches the "View kit" chip eight lines below, which was always
            // the legible one.
            <span className="absolute left-2.5 top-2.5 rounded-full bg-gz-navy-deep/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              {kind}
            </span>
          )
        )}

        {/* Quick-view overlay */}
        <div className="gz-quick pointer-events-none absolute inset-x-2.5 bottom-2.5 translate-y-2.5 opacity-0 transition-[opacity,transform,translate] gz-slow ease-gz-out">
          <span className="block rounded-lg bg-gz-navy-deep/90 py-2 text-center text-[11px] font-extrabold uppercase tracking-wide text-white backdrop-blur-sm">
            View kit
          </span>
        </div>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-gz-navy-deep/60">
            <span className="-rotate-6 rounded border-2 border-white px-2 py-1 font-[family-name:var(--font-display)] text-sm uppercase text-white">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-gz-red">{product.team}</p>
        <Heading className="mt-0.5 font-[family-name:var(--font-display)] text-base uppercase leading-tight text-gz-navy">
          {product.name}
        </Heading>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-extrabold text-gz-text">${product.price}</span>
          {product.sizes.length > 0 && (
            <span className="text-[10px] font-semibold tracking-wide text-gz-muted">
              {product.sizes.join(" · ")}
            </span>
          )}
        </div>
      </div>
      </Link>

    </div>
  );
}
