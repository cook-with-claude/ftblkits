"use client";

import { useSyncExternalStore } from "react";

// Deliberately narrow. The storefront already confirms "Added to cart" inline
// next to the button that was pressed, which is better feedback than a toast in
// the corner — so this is reserved for things with no natural home in the page:
// failed requests, lost connections, and admin mutation results.

export type ToastTone = "error" | "success";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const DISMISS_MS: Record<ToastTone, number> = {
  // Errors get longer: they usually carry something the user has to act on.
  error: 6000,
  success: 3000,
};

let nextId = 1;
let toasts: Toast[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function toast(message: string, tone: ToastTone = "error"): number {
  const id = nextId++;
  toasts = [...toasts, { id, message, tone }];
  emit();
  setTimeout(() => dismissToast(id), DISMISS_MS[tone]);
  return id;
}

export function dismissToast(id: number) {
  const next = toasts.filter((t) => t.id !== id);
  // Guard the identity: bailing out when nothing changed keeps the snapshot
  // reference stable, which is what useSyncExternalStore needs to avoid loops.
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return toasts;
}

// Shared empty array so the server snapshot is reference-stable across renders.
const EMPTY: Toast[] = [];
function getServerSnapshot() {
  return EMPTY;
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
