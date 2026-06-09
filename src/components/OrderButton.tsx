"use client";

import type { Jersey, SiteSettings, Size } from "@/lib/types";
import { buildOrderMessage, buildWhatsappLink } from "@/lib/whatsapp";

export function OrderButton({
  jersey,
  settings,
  selectedSize,
  pageUrl,
}: {
  jersey: Jersey;
  settings: SiteSettings;
  selectedSize: Size | null;
  pageUrl: string;
}) {
  const disabled = selectedSize === null;

  const href = disabled
    ? undefined
    : buildWhatsappLink(
        settings.whatsappNumber,
        buildOrderMessage(settings.orderMessageTemplate, {
          team: jersey.team,
          kit: jersey.kitType,
          size: selectedSize,
          price: jersey.price,
          link: pageUrl,
        }),
      );

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-gz-bg/95 p-4 backdrop-blur">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={disabled}
        onClick={(e) => disabled && e.preventDefault()}
        className={`flex min-h-12 w-full items-center justify-center rounded-full text-base font-extrabold transition-colors duration-200 ${
          disabled
            ? "cursor-not-allowed bg-white/10 text-white/40"
            : "bg-gz-whatsapp text-black"
        }`}
      >
        {disabled ? "Select a size" : "Order on WhatsApp"}
      </a>
    </div>
  );
}
