"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { buildCartMessage, cartCount, cartTotal, formatPrice } from "@/lib/cart";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { lockBodyScroll, useDisclosureTransition } from "@/lib/motion";
import { CART_TRIGGER_ATTR, subscribeToCartOpen, useCart } from "./useCart";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

// Matches --gz-dur-slow. Kept in sync by hand because the hook needs the number
// in JS to know when the exit animation has finished and the panel can unmount.
const TRANSITION_MS = 320;

// Mounted as a sibling of <Header>, never inside it. The header carries
// `backdrop-blur`, and a backdrop-filter establishes a containing block for
// `position: fixed` descendants — nesting this there silently clips the whole
// overlay to the header's box.
//
// It therefore owns its own open state and listens for the open event, so the
// trigger and the panel need no shared context.
export function CartPanel() {
  const { lines, remove, setQuantity, clear } = useCart();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // `mounted` outlives `open` by one transition, which is what gives the panel
  // an exit animation. Previously this component returned null the moment it
  // closed, so a full-height drawer simply vanished.
  const { mounted, entered } = useDisclosureTransition(open, TRANSITION_MS);

  useEffect(() => subscribeToCartOpen(() => setOpen(true)), []);

  // Hand focus back to whatever opened the panel.
  const onClose = useCallback(() => {
    setOpen(false);
    document.querySelector<HTMLElement>(`[${CART_TRIGGER_ATTR}]`)?.focus();
  }, []);

  const count = cartCount(lines);
  const total = cartTotal(lines);
  const href = lines.length > 0 ? buildWhatsappLink(WHATSAPP_NUMBER, buildCartMessage(lines)) : undefined;

  // Escape closes; Tab is kept inside the panel while it is open. Focus goes to
  // the close button on open, and the header restores it to the cart button on
  // close, matching how the nav dropdowns already behave.
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Stop the page behind the panel from scrolling. The shared helper also
  // compensates for the scrollbar's width, so the page no longer shifts
  // sideways as the panel opens.
  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: "var(--gz-z-overlay)" }}>
      <div
        className={`absolute inset-0 bg-gz-navy-deep/50 backdrop-blur-[2px] transition-opacity gz-slow ease-gz-out ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        // transform, not width or right: the panel travels on the compositor,
        // so opening the cart never lays out the page behind it.
        className={`absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-gz-bg shadow-[0_0_60px_-12px_rgba(0,0,0,0.5)] transition-transform gz-slow ${
          entered ? "translate-x-0 ease-gz-spring" : "translate-x-full ease-gz-in-out"
        }`}
      >
        <div className="gz-flagbar h-1 w-full shrink-0" aria-hidden="true" />

        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gz-border px-4 py-3">
          <h2
            id="cart-title"
            className="font-[family-name:var(--font-display)] text-xl uppercase text-gz-navy"
          >
            Your cart
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gz-border text-gz-navy transition-colors gz-base ease-gz-out hover:bg-gz-bg-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy/40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-[family-name:var(--font-display)] text-2xl uppercase text-gz-navy">
              Your cart is empty
            </p>
            <p className="mt-2 text-sm text-gz-body">
              Add a few kits and send them all in one WhatsApp message.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 min-h-11 cursor-pointer rounded-full bg-gz-navy px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition-opacity gz-base ease-gz-out hover:opacity-90"
            >
              Keep browsing
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-4 py-3">
              {lines.map((line) => (
                <li
                  key={`${line.id}__${line.size}`}
                  className="flex gap-3 border-b border-gz-border py-3 last:border-b-0"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-gz-border bg-gz-bg-alt">
                    {line.imageUrl ? (
                      <Image src={line.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <div
                        className="flex h-full items-center justify-center text-2xl text-white"
                        style={{ background: "radial-gradient(130% 130% at 30% 12%, #3a1450, #15206b 72%)" }}
                        aria-hidden="true"
                      >
                        ?
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-gz-red">
                      {line.team}
                    </p>
                    <p className="font-[family-name:var(--font-display)] text-base uppercase leading-tight text-gz-navy">
                      {line.name}
                    </p>
                    <p className="mt-0.5 text-xs text-gz-muted">
                      Size {line.size} · {formatPrice(line.price)} each
                    </p>
                    {line.notes?.trim() && (
                      <p className="mt-1 text-xs italic text-gz-muted">“{line.notes.trim()}”</p>
                    )}

                    <div className="mt-2 flex items-center gap-3">
                      <div className="inline-flex items-center rounded-lg border border-gz-border bg-gz-surface">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.id, line.size, line.quantity - 1)}
                          aria-label={`Decrease quantity of ${line.name}, size ${line.size}`}
                          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-l-lg text-gz-navy transition-colors gz-base ease-gz-out hover:bg-gz-bg-alt"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4" aria-hidden="true">
                            <path d="M5 12h14" strokeLinecap="round" />
                          </svg>
                        </button>
                        <span className="w-9 select-none text-center text-sm font-bold text-gz-text">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.id, line.size, line.quantity + 1)}
                          aria-label={`Increase quantity of ${line.name}, size ${line.size}`}
                          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-r-lg text-gz-navy transition-colors gz-base ease-gz-out hover:bg-gz-bg-alt"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4" aria-hidden="true">
                            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => remove(line.id, line.size)}
                        className="min-h-11 cursor-pointer px-1 text-xs font-bold text-gz-red hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy/40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="shrink-0 border-t border-gz-border bg-gz-bg-alt px-4 py-4">
              <div className="flex items-baseline justify-between" aria-live="polite">
                <span className="text-sm font-bold text-gz-body">
                  {count} {count === 1 ? "kit" : "kits"}
                </span>
                <span className="font-[family-name:var(--font-display)] text-2xl text-gz-navy">
                  {formatPrice(total)}
                </span>
              </div>

              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-gz-whatsapp text-base font-extrabold text-black transition-opacity gz-base ease-gz-out hover:opacity-90"
              >
                Order all on WhatsApp
              </a>

              <p className="mt-2 text-center text-[11px] leading-relaxed text-gz-muted">
                Sends one message with every kit. We confirm sizes, delivery and the final
                price in the chat.
              </p>

              <button
                type="button"
                onClick={clear}
                className="mt-2 min-h-11 w-full cursor-pointer text-xs font-bold text-gz-muted hover:text-gz-red"
              >
                Empty cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
