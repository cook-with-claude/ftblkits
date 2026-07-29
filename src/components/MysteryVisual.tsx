import Image from "next/image";
import type { Product } from "@/lib/types";
import { getMysteryProductMeta } from "@/lib/mystery";

export function MysteryVisual({
  product,
  size = "card",
}: {
  product: Product;
  size?: "card" | "detail";
}) {
  const meta = getMysteryProductMeta(product);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#f6f5f3]">
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt={`${product.name} premium box`}
          fill
          sizes={size === "detail" ? "(max-width: 768px) 100vw, 600px" : "33vw"}
          className="object-cover"
          priority={size === "detail"}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gz-navy-deep via-gz-navy to-[#3a1450]" />
      )}

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gz-navy-deep/45 via-transparent to-transparent"
        aria-hidden="true"
      />
      <span className="absolute left-4 top-4 rounded-full border border-white/35 bg-gz-navy-deep/75 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
        Limited Mystery Series
      </span>
      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 rounded-2xl border border-white/20 bg-gz-navy-deep/75 p-3 text-white backdrop-blur-md sm:inset-x-5 sm:bottom-5 sm:p-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/65">
            {meta.eyebrow}
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-xl uppercase leading-none sm:text-2xl">
            {meta.shortName}
          </p>
        </div>
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_20px_currentColor]"
          style={{ backgroundColor: meta.accent, color: meta.accent }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
