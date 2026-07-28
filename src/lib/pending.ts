"use client";

import { useSyncExternalStore } from "react";

// One global "something is in flight" signal, shared by the navigation progress
// bar and the favicon indicator so they can never disagree about the state.
//
// It is a counter, not a boolean: a route change and an admin upload can overlap,
// and the last one to finish should be the one that clears the indicators.
//
// Follows the same shape as components/cart/useCart.ts — a module-level store
// read through useSyncExternalStore, with a stable server snapshot.

// Nothing may stay pending forever. If a caller leaks its end() — a rejected
// promise with no catch, a navigation the router silently drops — this releases
// the slot anyway, so the tab can never be left spinning.
const MAX_PENDING_MS = 10_000;

let count = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/**
 * Marks the start of work worth showing an indicator for. Returns the function
 * that ends it; calling it more than once is a no-op.
 */
export function begin(): () => void {
  count += 1;
  emit();

  let released = false;

  const end = () => {
    if (released) return;
    released = true;
    clearTimeout(timer);
    count = Math.max(0, count - 1);
    emit();
  };

  // `end` closes over `timer` but is only ever invoked later, so the reference
  // is resolved by the time it runs.
  const timer = setTimeout(end, MAX_PENDING_MS);
  return end;
}

/** Releases every outstanding slot. Used when a navigation settles. */
export function reset() {
  if (count === 0) return;
  count = 0;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return count > 0;
}

/** The current state, readable outside a React render. */
export function isPending(): boolean {
  return getSnapshot();
}

// The server never has work in flight, and returning a constant keeps the first
// client render identical to the server's.
function getServerSnapshot() {
  return false;
}

export function useIsPending(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Wraps a promise so the indicators cover it. The slot is released whether the
 * promise resolves or rejects.
 */
export async function withPending<T>(work: Promise<T>): Promise<T> {
  const end = begin();
  try {
    return await work;
  } finally {
    end();
  }
}
