"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { OrderButton } from "./OrderButton";

export function SizePicker({ product, pageUrl }: { product: Product; pageUrl: string }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <>
      {product.sizes.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-white/60">Select size</h2>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Select size">
            {product.sizes.map((size) => {
              const isSelected = selected === size;
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(size)}
                  className={`flex h-12 min-w-12 items-center justify-center rounded-xl px-3 text-sm font-bold transition-colors duration-200 ${
                    isSelected ? "bg-gz-red text-white" : "bg-gz-surface text-white"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <OrderButton product={product} selectedSize={selected} pageUrl={pageUrl} />
    </>
  );
}
