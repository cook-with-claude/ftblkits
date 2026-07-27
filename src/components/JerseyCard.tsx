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
    <div className="gz-card group relative overflow-hidden rounded-2xl border border-gz-border bg-gz-surface transition-all duration-300 hover:-translate-y-1.5 hover:border-gz-navy/30 hover:shadow-xl hover:shadow-gz-navy/15">
      <Link
        href={`/jersey/${product.id}`}
        className="block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gz-navy"
      >
      <div className="relative aspect-square overflow-hidden bg-gz-navy-deep">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="gz-card-img object-cover transition-transform duration-500 ease-out"
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
            <span className="absolute left-2.5 top-2.5 rounded-full bg-gz-navy-deep/45 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              {kind}
            </span>
          )
        )}

        {/* Quick-view overlay */}
        <div className="gz-quick pointer-events-none absolute inset-x-2.5 bottom-2.5 translate-y-2.5 opacity-0 transition-all duration-300">
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
