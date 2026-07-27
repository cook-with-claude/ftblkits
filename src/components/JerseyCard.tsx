"use client";

import { useSyncExternalStore } from "react";
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

const WISHLIST_KEY = "gz-wishlist";
const WISHLIST_EVENT = "gz-wishlist-change";

function readWishlist(): Record<string, true> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(WISHLIST_KEY) ?? "{}");
  } catch {
    return {};
  }
}

// Subscribe to wishlist changes: cross-tab via the "storage" event, same-tab via a
// custom event we dispatch on every toggle.
function subscribeWishlist(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(WISHLIST_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(WISHLIST_EVENT, onChange);
  };
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

  // localStorage-backed wishlist state; server snapshot is always false, so there is
  // no hydration mismatch and the heart fills in on the client.
  const wished = useSyncExternalStore(
    subscribeWishlist,
    () => Boolean(readWishlist()[product.id]),
    () => false,
  );

  const toggleWish = () => {
    const list = readWishlist();
    if (list[product.id]) delete list[product.id];
    else list[product.id] = true;
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(WISHLIST_EVENT));
  };

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

      <button
        type="button"
        onClick={toggleWish}
        aria-label={wished ? `Remove ${product.name} from saved kits` : `Save ${product.name}`}
        aria-pressed={wished}
        className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-red"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={wished ? "#e10600" : "none"}
          stroke={wished ? "#e10600" : "#5A6172"}
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            d="M12 21s-7.5-4.9-10-9.5C.5 8 2 4.5 5.3 4.5c2 0 3.3 1.2 3.9 2.2h1.6c.6-1 1.9-2.2 3.9-2.2C21 4.5 22.5 8 21 11.5 18.5 16.1 12 21 12 21z"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
