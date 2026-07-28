"use client";

import { useEffect, useState } from "react";

/**
 * The JS-side counterpart to the `prefers-reduced-motion` block in globals.css.
 * CSS can clamp durations, but it cannot tell a component to skip scheduling an
 * animation at all — this can.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Keeps an element mounted through its exit animation.
 *
 * `mounted` stays true for `ms` after `open` goes false, so the closing
 * transition has something to run on; `entered` flips one frame after mount so
 * the browser has a chance to paint the "from" state first. Without that frame
 * the element mounts already in its final position and nothing animates.
 *
 * This is the dependency-free equivalent of an <AnimatePresence> wrapper, which
 * is the only thing the cart panel and the mobile drawer were missing.
 */
export function useDisclosureTransition(open: boolean, ms: number) {
  const [mounted, setMounted] = useState(open);
  const [ready, setReady] = useState(open);

  // Mounting on open is adjusted during render, not in an effect: React applies
  // it before painting, so the element is in the tree on the very first frame
  // and the opening transition is never a frame late. Same technique the header
  // already uses to close its menus on navigation.
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    // With reduced motion the CSS transition is already clamped to ~0, so
    // holding the element mounted for the full duration would just leave an
    // invisible overlay swallowing clicks.
    const duration = prefersReducedMotion() ? 0 : ms;

    if (!open) {
      // `ready` resets here rather than immediately so the next open replays
      // the enter transition from the start.
      const timer = setTimeout(() => {
        setMounted(false);
        setReady(false);
      }, duration);
      return () => clearTimeout(timer);
    }

    // Two frames: one for the browser to paint the "from" state, one to flip to
    // the "to" state. Flipping in the same frame as the mount means the element
    // is only ever painted in its final position and nothing animates.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [open, ms]);

  // Derived rather than stored, so closing takes effect on the same render that
  // `open` flips instead of waiting for the timeout.
  return { mounted, entered: open && ready };
}

// Ref-counted so the cart opening on top of the mobile drawer does not let the
// first one to close unlock the page while the second is still open.
let lockCount = 0;
let restore: (() => void) | null = null;

/**
 * Freezes background scrolling. Compensates for the scrollbar's width, without
 * which the whole page visibly jumps sideways the moment an overlay opens.
 */
export function lockBodyScroll(): () => void {
  lockCount += 1;

  if (lockCount === 1) {
    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    restore = () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0 && restore) {
      restore();
      restore = null;
    }
  };
}
