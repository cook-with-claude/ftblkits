"use client";

import { useState } from "react";
import type { Jersey, SiteSettings, Size } from "@/lib/types";
import { OrderButton } from "./OrderButton";

export function SizePicker({
  jersey,
  settings,
  pageUrl,
}: {
  jersey: Jersey;
  settings: SiteSettings;
  pageUrl: string;
}) {
  const [selected, setSelected] = useState<Size | null>(null);

  return (
    <>
      <div className="mt-6">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-white/60">Select size</h2>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Select size">
          {jersey.sizes.map((s) => {
            const isSelected = selected === s.size;
            return (
              <button
                key={s.size}
                type="button"
                disabled={!s.inStock}
                aria-pressed={isSelected}
                onClick={() => setSelected(s.size)}
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold transition-colors duration-200 ${
                  !s.inStock
                    ? "cursor-not-allowed bg-white/5 text-white/30 line-through"
                    : isSelected
                      ? "bg-gz-red text-white"
                      : "bg-gz-surface text-white"
                }`}
              >
                {s.size}
              </button>
            );
          })}
        </div>
      </div>
      <OrderButton jersey={jersey} settings={settings} selectedSize={selected} pageUrl={pageUrl} />
    </>
  );
}
