"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { buildCartMessage, type CartLine } from "@/lib/cart";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { openCart, useCart } from "./cart/useCart";

export function OrderButton({
  product,
  selectedSize,
  quantity,
  notes,
}: {
  product: Product;
  selectedSize: string | null;
  quantity: number;
  notes: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const soldOut = !product.inStock;
  const disabled = soldOut || selectedSize === null;

  const request = notes.trim();

  const line: CartLine | null =
    selectedSize === null
      ? null
      : {
          id: product.id,
          size: selectedSize,
          quantity,
          name: product.name,
          team: product.team,
          price: product.price,
          imageUrl: product.imageUrl,
          isMystery: product.isMystery,
          notes: product.isMystery && request ? request : undefined,
        };

  // The express path builds the same message shape as the cart, so the shop
  // receives one format regardless of which button was pressed.
  const href =
    disabled || !line ? undefined : buildWhatsappLink(WHATSAPP_NUMBER, buildCartMessage([line]));

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    [],
  );

  // Deliberately does not open the panel: the point of a cart here is adding
  // several kits in a row, and a panel that reopens each time fights that.
  const handleAdd = () => {
    if (!line) return;
    add(line);
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 2500);
  };

  const orderLabel = soldOut
    ? "Sold Out"
    : selectedSize === null
      ? "Select a size"
      : "Order on WhatsApp";

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gz-border bg-gz-bg/95 p-4 backdrop-blur">
      <div className="mx-auto max-w-6xl">
        <div aria-live="polite" className="min-h-5">
          {added && (
            <p className="mb-2 text-center text-sm font-bold text-gz-green">
              Added to cart ·{" "}
              <button
                type="button"
                onClick={openCart}
                className="cursor-pointer text-gz-navy underline hover:text-gz-red"
              >
                View cart
              </button>
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAdd}
            disabled={disabled}
            className={`flex min-h-12 flex-1 items-center justify-center rounded-full border-2 text-sm font-extrabold uppercase tracking-wide transition-colors duration-200 sm:text-base ${
              disabled
                ? "cursor-not-allowed border-gz-border bg-gz-bg-alt text-gz-muted"
                : "cursor-pointer border-gz-navy text-gz-navy hover:bg-gz-navy hover:text-white"
            }`}
          >
            Add to cart
          </button>

          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={disabled}
            onClick={(e) => disabled && e.preventDefault()}
            className={`flex min-h-12 flex-1 items-center justify-center rounded-full text-sm font-extrabold transition-opacity duration-200 sm:text-base ${
              disabled
                ? "cursor-not-allowed bg-gz-bg-alt text-gz-muted"
                : "cursor-pointer bg-gz-whatsapp text-black hover:opacity-90"
            }`}
          >
            {orderLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
