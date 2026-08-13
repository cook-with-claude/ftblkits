"use client";

import { useCallback, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { OrderButton } from "./OrderButton";
import { SizeChart } from "./SizeChart";

const MAX_QTY = 99;

export function SizePicker({ product }: { product: Product }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const sizeRowRef = useRef<HTMLDivElement>(null);

  // Handed to OrderButton so pressing an action with no size chosen scrolls the
  // row into view and lands focus on the first pill — the answer to the prompt
  // it announces, rather than just the prompt.
  const requestSize = useCallback(() => {
    const row = sizeRowRef.current;
    if (!row) return;
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    row.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      {product.sizes.length > 0 && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-gz-muted">Select size</h2>
            <SizeChart sections={product.sections} />
          </div>
          <div ref={sizeRowRef} className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Select size">
            {product.sizes.map((size) => {
              const isSelected = selected === size;
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelected(size)}
                  className={`flex h-12 min-w-12 cursor-pointer items-center justify-center rounded-xl px-3 text-sm font-bold transition-colors gz-base ease-gz-out ${
                    isSelected
                      ? "bg-gz-navy text-white"
                      : "border border-gz-border bg-gz-surface text-gz-navy hover:border-gz-navy/40"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-gz-muted">Quantity</h2>
        <div className="mt-2 inline-flex items-center rounded-xl border border-gz-border bg-gz-surface">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-12 w-12 items-center justify-center rounded-l-xl text-gz-navy transition-colors gz-base ease-gz-out enabled:cursor-pointer enabled:hover:bg-gz-bg-alt disabled:cursor-not-allowed disabled:text-gz-border"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5" aria-hidden="true">
              <path d="M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
          <span
            aria-live="polite"
            aria-label={`Quantity: ${quantity}`}
            className="w-12 select-none text-center text-base font-bold text-gz-text"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(MAX_QTY, q + 1))}
            disabled={quantity >= MAX_QTY}
            aria-label="Increase quantity"
            className="flex h-12 w-12 items-center justify-center rounded-r-xl text-gz-navy transition-colors gz-base ease-gz-out enabled:cursor-pointer enabled:hover:bg-gz-bg-alt disabled:cursor-not-allowed disabled:text-gz-border"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5" aria-hidden="true">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {product.isMystery && (
        <div className="mt-6">
          <label
            htmlFor="special-request"
            className="text-xs font-extrabold uppercase tracking-widest text-gz-muted"
          >
            Special request{" "}
            <span className="font-bold normal-case tracking-normal text-gz-muted/80">(optional)</span>
          </label>
          <textarea
            id="special-request"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="e.g. prefer an away kit, favourite team, no goalkeeper kits…"
            className="mt-2 w-full resize-none rounded-xl border border-gz-border bg-gz-surface px-4 py-3 text-base text-gz-text placeholder:text-gz-muted focus:border-gz-magenta focus:outline-none focus:ring-2 focus:ring-gz-magenta/40"
          />
          <p className="mt-1 text-right text-xs text-gz-muted">{notes.length}/200</p>
        </div>
      )}

      <OrderButton
        product={product}
        selectedSize={selected}
        quantity={quantity}
        notes={notes}
        onRequestSize={requestSize}
      />
    </>
  );
}
