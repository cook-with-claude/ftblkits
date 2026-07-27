"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  addLine,
  parseCart,
  removeLine,
  setLineQuantity,
  type CartLine,
} from "@/lib/cart";

const CART_KEY = "gz-cart";
// localStorage's own "storage" event only fires in *other* tabs, so same-tab
// updates need their own signal. Same pattern the wishlist used.
const CART_EVENT = "gz-cart-change";

// A stable empty array: useSyncExternalStore compares snapshots by reference, so
// returning a fresh [] each time would loop forever.
const EMPTY: CartLine[] = [];

let cache: { raw: string | null; lines: CartLine[] } = { raw: null, lines: EMPTY };

function readCart(): CartLine[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(CART_KEY);
  if (raw === cache.raw) return cache.lines;

  let lines: CartLine[] = EMPTY;
  try {
    lines = raw ? parseCart(JSON.parse(raw)) : EMPTY;
  } catch {
    // Corrupt or hand-edited storage empties the cart rather than throwing
    // during render and taking the whole page down.
    lines = EMPTY;
  }
  cache = { raw, lines };
  return lines;
}

function writeCart(lines: CartLine[]): void {
  window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event(CART_EVENT));
}

// The panel lives in the header, but "View cart" after adding lives in the order
// bar — a different tree. A tiny event beats threading a context provider
// through the whole storefront for one boolean.
const CART_OPEN_EVENT = "gz-cart-open";

// Marks the header's cart button so the panel can hand focus back on close
// without the two components sharing a ref.
export const CART_TRIGGER_ATTR = "data-cart-trigger";

export function openCart(): void {
  window.dispatchEvent(new Event(CART_OPEN_EVENT));
}

export function subscribeToCartOpen(onOpen: () => void): () => void {
  window.addEventListener(CART_OPEN_EVENT, onOpen);
  return () => window.removeEventListener(CART_OPEN_EVENT, onOpen);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CART_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CART_EVENT, onChange);
  };
}

export function useCart() {
  // Server snapshot is always the empty cart: the server cannot know what is in
  // this browser, and returning anything else would cause a hydration mismatch.
  const lines = useSyncExternalStore(subscribe, readCart, () => EMPTY);

  const add = useCallback((line: CartLine) => writeCart(addLine(readCart(), line)), []);
  const remove = useCallback(
    (id: string, size: string) => writeCart(removeLine(readCart(), id, size)),
    [],
  );
  const setQuantity = useCallback(
    (id: string, size: string, quantity: number) =>
      writeCart(setLineQuantity(readCart(), id, size, quantity)),
    [],
  );
  const clear = useCallback(() => writeCart([]), []);

  return { lines, add, remove, setQuantity, clear };
}
