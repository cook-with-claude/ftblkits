"use client";

import type { Product } from "@/lib/types";
import { buildOrderMessage, buildWhatsappLink } from "@/lib/whatsapp";
import { WHATSAPP_NUMBER, ORDER_MESSAGE_TEMPLATE } from "@/lib/config";

export function OrderButton({
  product,
  selectedSize,
  pageUrl,
}: {
  product: Product;
  selectedSize: string | null;
  pageUrl: string;
}) {
  const soldOut = !product.inStock;
  const disabled = soldOut || selectedSize === null;

  const href = disabled
    ? undefined
    : buildWhatsappLink(
        WHATSAPP_NUMBER,
        buildOrderMessage(ORDER_MESSAGE_TEMPLATE, {
          name: product.name,
          size: selectedSize,
          price: product.price,
          link: pageUrl,
        }),
      );

  const label = soldOut ? "Sold Out" : selectedSize === null ? "Select a size" : "Order on WhatsApp";

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gz-border bg-gz-bg/95 p-4 backdrop-blur">
      <div className="mx-auto max-w-6xl">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={disabled}
          onClick={(e) => disabled && e.preventDefault()}
          className={`flex min-h-12 w-full items-center justify-center rounded-full text-base font-extrabold transition-opacity duration-200 ${
            disabled
              ? "cursor-not-allowed bg-gz-bg-alt text-gz-muted"
              : "cursor-pointer bg-gz-whatsapp text-black hover:opacity-90"
          }`}
        >
          {label}
        </a>
      </div>
    </div>
  );
}
