"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Product } from "@/lib/types";
import { buildCartMessage, type CartLine } from "@/lib/cart";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { openCart, useCart } from "./cart/useCart";

const ADDED_MS = 2500;
const HINT_MS = 4000;

const BUTTON_BASE =
  "flex min-h-12 flex-1 items-center justify-center rounded-full text-sm font-extrabold transition-colors gz-base ease-gz-out sm:text-base";
const ADD_BASE = `${BUTTON_BASE} border-2 uppercase tracking-wide`;

// Rendered twice — once inline under the size picker, once in the mobile bar
// that takes over after the inline copy scrolls away. Extracted so the two can
// never drift apart.
function OrderActions({
  unavailable,
  unavailableLabel,
  href,
  added,
  onAdd,
  onNeedSize,
}: {
  unavailable: boolean;
  unavailableLabel: string;
  href: string | undefined;
  added: boolean;
  onAdd: () => void;
  onNeedSize: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={unavailable ? undefined : href ? onAdd : onNeedSize}
        aria-disabled={unavailable}
        className={`${ADD_BASE} ${
          unavailable
            ? "cursor-not-allowed border-gz-border bg-gz-bg-alt text-gz-muted"
            : added
              ? "cursor-pointer border-gz-green bg-gz-green text-white"
              : "cursor-pointer border-gz-navy text-gz-navy hover:bg-gz-navy hover:text-white"
        }`}
      >
        {/* B5: the button itself carries the confirmation, so the feedback is
            not purely a separate line of text that a thumb may be covering. */}
        {added ? "Added ✓" : "Add to cart"}
      </button>

      {/* Green and focusable from first paint. This used to be an <a> with an
          undefined href while no size was picked, which maps to role generic:
          it ignored aria-disabled, took no focus, and left the whole action row
          with zero tabbable elements until a size was chosen. A real <button>
          that prompts for the size is both reachable and more useful than a
          dead control. */}
      {unavailable ? (
        <button
          type="button"
          aria-disabled="true"
          className={`${BUTTON_BASE} cursor-not-allowed bg-gz-bg-alt text-gz-muted`}
        >
          {unavailableLabel}
        </button>
      ) : href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${BUTTON_BASE} cursor-pointer bg-gz-whatsapp text-black hover:opacity-90`}
        >
          Order on WhatsApp
        </a>
      ) : (
        <button
          type="button"
          onClick={onNeedSize}
          className={`${BUTTON_BASE} cursor-pointer bg-gz-whatsapp text-black hover:opacity-90`}
        >
          Order on WhatsApp
        </button>
      )}
    </div>
  );
}

export function OrderButton({
  product,
  selectedSize,
  quantity,
  notes,
  onRequestSize,
  controlsRef,
}: {
  product: Product;
  selectedSize: string | null;
  quantity: number;
  notes: string;
  // Focuses and scrolls to the size row. Owned by SizePicker, which renders it.
  onRequestSize?: () => void;
  // The whole buying block — size row, quantity, and the inline buttons below.
  // The mobile bar stays away while any of it is visible. Falls back to
  // watching just the buttons when no wrapper is supplied.
  controlsRef?: RefObject<HTMLElement | null>;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [hint, setHint] = useState("");
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The inline copy is the real one. The fixed bar is mounted only while the
  // buying controls have scrolled out of view, which is what stops it sitting
  // over the size pills — the whole point of the change.
  const inlineRef = useRef<HTMLDivElement>(null);
  const [controlsVisible, setControlsVisible] = useState(true);

  const soldOut = !product.inStock;
  // A kit saved from /admin with no sizes has nothing to pick, so prompting for
  // one would send the shopper to a row that does not exist. There are none in
  // the catalogue today; this keeps the dead end honest if one appears.
  const unavailable = soldOut || product.sizes.length === 0;
  const unavailableLabel = soldOut ? "Sold Out" : "Unavailable";

  const request = notes.trim();

  // Memoised so handleAdd's identity survives a re-render — without it the
  // callback is new every time and the fixed bar re-renders on every scroll
  // tick that flips the observer.
  const line: CartLine | null = useMemo(
    () =>
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
          },
    [product, selectedSize, quantity, request],
  );

  // The express path builds the same message shape as the cart, so the shop
  // receives one format regardless of which button was pressed.
  const href =
    unavailable || !line ? undefined : buildWhatsappLink(WHATSAPP_NUMBER, buildCartMessage([line]));

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );

  useEffect(() => {
    const el = controlsRef?.current ?? inlineRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setControlsVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, [controlsRef]);

  // Deliberately does not open the panel: the point of a cart here is adding
  // several kits in a row, and a panel that reopens each time fights that.
  const handleAdd = useCallback(() => {
    if (!line) return;
    add(line);
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), ADDED_MS);
  }, [add, line]);

  // Pressing an action with no size chosen now answers the question instead of
  // doing nothing: it says what is missing and puts the size row under the
  // thumb (and under keyboard focus).
  const handleNeedSize = useCallback(() => {
    setHint("Pick a size first");
    if (hintTimer.current) clearTimeout(hintTimer.current);
    // Cleared so pressing again re-announces: an aria-live region only speaks
    // when its content changes.
    hintTimer.current = setTimeout(() => setHint(""), HINT_MS);
    onRequestSize?.();
  }, [onRequestSize]);

  return (
    <>
      <div ref={inlineRef} className="mt-6">
        {/* Two live regions, not one: a shared region means the "pick a size"
            prompt and the add confirmation overwrite each other
            mid-announcement. They share one reserved row because only ever one
            of them has content — nesting keeps the space they hold open at a
            single line rather than two. */}
        <div className="min-h-5">
          <div aria-live="assertive">
            {hint && <p className="mb-2 text-sm font-bold text-gz-red">{hint}</p>}
          </div>
          <div aria-live="polite">
            {added && (
              <p className="mb-2 text-sm font-bold text-gz-green">
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
        </div>

        <OrderActions
          unavailable={unavailable}
          unavailableLabel={unavailableLabel}
          href={href}
          added={added}
          onAdd={handleAdd}
          onNeedSize={handleNeedSize}
        />
      </div>

      {/* Phones only. On a desktop viewport the bar was permanently spending
          about 14% of the screen on two buttons the page already shows. */}
      {!controlsVisible && (
        <div
          className="fixed inset-x-0 bottom-0 border-t border-gz-border bg-gz-bg/95 px-4 pt-4 backdrop-blur md:hidden"
          style={{
            zIndex: "var(--gz-z-sticky)",
            // Clears the home indicator on notched phones, where the bar
            // previously ran underneath it.
            paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
        >
          <div className="mx-auto max-w-6xl">
            <OrderActions
              unavailable={unavailable}
              unavailableLabel={unavailableLabel}
              href={href}
              added={added}
              onAdd={handleAdd}
              onNeedSize={handleNeedSize}
            />
          </div>
        </div>
      )}
    </>
  );
}
