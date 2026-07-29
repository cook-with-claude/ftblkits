import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { isSoldOut } from "@/lib/catalog";
import { getMysteryProductMeta } from "@/lib/mystery";

export function MysteryCard({
  product,
  headingLevel = "h3",
}: {
  product: Product;
  headingLevel?: "h2" | "h3";
}) {
  const soldOut = isSoldOut(product);
  const meta = getMysteryProductMeta(product);
  const Heading = headingLevel;

  return (
    <Link
      href={`/jersey/${product.id}`}
      aria-label={`Open ${product.name}`}
      className="group relative block min-w-0 cursor-pointer overflow-hidden rounded-[20px] border border-white/15 bg-white/[0.07] shadow-[0_18px_44px_-30px_rgba(0,0,0,0.9)] transition-[transform,translate,border-color,background-color,box-shadow] gz-slow ease-gz-out hover:-translate-y-1.5 hover:border-white/45 hover:bg-white/[0.11] hover:shadow-[0_24px_48px_-24px_rgba(0,0,0,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:translate-y-0 active:gz-fast"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f6f5f3]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={`${meta.shortName} mystery football kit box`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform gz-slower ease-gz-out group-hover:scale-[1.035] group-focus-visible:scale-[1.035]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gz-navy-deep via-gz-navy to-[#3a1450]" />
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gz-navy-deep/70 via-transparent to-transparent"
          aria-hidden="true"
        />
        <span
          className="absolute left-3 top-3 rounded-full border border-white/25 bg-gz-navy-deep/75 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-white backdrop-blur-sm"
          style={{ boxShadow: `inset 3px 0 0 ${meta.accent}` }}
        >
          {meta.eyebrow}
        </span>
        <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">
          <span>{meta.promise}</span>
          <span className="shrink-0 transition-transform gz-base ease-gz-out group-hover:translate-x-0.5">
            View →
          </span>
        </span>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-gz-navy-deep/70">
            <span className="-rotate-6 rounded border-2 border-white px-3 py-1 font-[family-name:var(--font-display)] text-lg uppercase text-white">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-gz-magenta">
              Mystery Kit
            </p>
            <Heading className="mt-1.5 font-[family-name:var(--font-display)] text-lg uppercase leading-none text-white">
              {meta.shortName}
            </Heading>
          </div>
          <p className="shrink-0 font-[family-name:var(--font-display)] text-2xl leading-none text-white">
            ${product.price.toFixed(2)}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span className="text-[11px] font-semibold text-white/65">Pick your size. We pick the kit.</span>
          <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wide text-white/75">
            {product.sizes.length} sizes
          </span>
        </div>
      </div>
    </Link>
  );
}
