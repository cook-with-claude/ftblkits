import Link from "next/link";
import type { Product } from "@/lib/types";
import { isSoldOut } from "@/lib/catalog";
import { MysteryVisual } from "./MysteryVisual";

// A mystery "tier" card. Lives inside the dark Mystery Kits panel, so it uses a glassy
// translucent body with white text and a magenta accent — distinct from the white
// JerseyCard used in the country grid.
export function MysteryCard({ product }: { product: Product }) {
  const soldOut = isSoldOut(product);

  return (
    <Link
      href={`/jersey/${product.id}`}
      className="group relative block cursor-pointer overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] transition-all duration-200 hover:-translate-y-0.5 hover:border-gz-magenta hover:bg-white/10 hover:shadow-lg hover:shadow-gz-magenta/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-magenta"
    >
      <div className="relative aspect-[5/4] overflow-hidden">
        <MysteryVisual />

        <span className="absolute left-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white backdrop-blur">
          Surprise me
        </span>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-gz-navy-deep/70">
            <span className="-rotate-6 rounded border-2 border-white px-3 py-1 font-[family-name:var(--font-display)] text-lg uppercase text-white">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-3 p-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-gz-magenta">
            Mystery Kit
          </p>
          <h3 className="mt-0.5 font-[family-name:var(--font-display)] text-lg uppercase leading-tight text-white">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-white/60">Kits worth up to $25</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-[family-name:var(--font-display)] text-2xl leading-none text-white">
            ${product.price}
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-gz-magenta transition-transform duration-200 group-hover:translate-x-0.5">
            Open
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
