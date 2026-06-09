import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { isSoldOut } from "@/lib/catalog";

export function JerseyCard({ product }: { product: Product }) {
  const soldOut = isSoldOut(product);

  return (
    <Link
      href={`/jersey/${product.id}`}
      className="group relative block overflow-hidden rounded-2xl bg-gz-surface transition-transform duration-200 active:scale-[0.98]"
    >
      <div className="relative aspect-square">
        {product.imageUrl && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
          />
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="-rotate-6 border-2 border-gz-red px-2 py-1 font-[family-name:var(--font-display)] text-sm uppercase text-gz-red">
              Sold Out
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-[family-name:var(--font-display)] text-base uppercase leading-tight">{product.name}</h3>
        <p className="text-xs font-extrabold uppercase tracking-wide text-gz-red">{product.country}</p>
        <p className="mt-1 text-sm font-bold">${product.price}</p>
        {product.sizes.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1" aria-label="Available sizes">
            {product.sizes.map((size) => (
              <li
                key={size}
                className="flex h-5 min-w-6 items-center justify-center rounded bg-white/10 px-1 text-[10px] font-bold text-white"
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
