import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { isSoldOut } from "@/lib/catalog";

export function JerseyCard({ product }: { product: Product }) {
  const soldOut = isSoldOut(product);

  return (
    <Link
      href={`/jersey/${product.id}`}
      className="group relative block cursor-pointer overflow-hidden rounded-2xl border border-gz-border bg-gz-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-gz-navy/30 hover:shadow-lg hover:shadow-gz-navy/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy"
    >
      <div className="relative aspect-square overflow-hidden bg-gz-bg-alt">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-gz-navy-deep/60">
            <span className="-rotate-6 rounded border-2 border-white px-2 py-1 font-[family-name:var(--font-display)] text-sm uppercase text-white">
              Sold Out
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-gz-red">{product.country}</p>
        <h3 className="mt-0.5 font-[family-name:var(--font-display)] text-base uppercase leading-tight text-gz-navy">
          {product.name}
        </h3>
        <p className="mt-1 text-sm font-bold text-gz-text">${product.price}</p>
        {product.sizes.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1" aria-label="Available sizes">
            {product.sizes.map((size) => (
              <li
                key={size}
                className="flex h-5 min-w-6 items-center justify-center rounded bg-gz-bg-alt px-1 text-[10px] font-bold text-gz-body"
              >
                {size}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
