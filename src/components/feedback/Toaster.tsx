"use client";

import { dismissToast, useToasts } from "@/lib/toast";

export function Toaster() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;

  return (
    // aria-live rather than role="alert": these announce without stealing focus
    // from whatever the user is doing.
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pb-4 sm:bottom-4 sm:right-4 sm:left-auto sm:items-end sm:px-0 sm:pb-0"
      style={{ zIndex: "var(--gz-z-toast)" }}
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`gz-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-[0_18px_38px_-14px_rgba(0,0,0,0.35)] ${
            t.tone === "error"
              ? "border-gz-red/30 bg-white text-gz-text"
              : "border-gz-green/30 bg-white text-gz-text"
          }`}
        >
          <span
            aria-hidden="true"
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
              t.tone === "error" ? "bg-gz-red" : "bg-gz-green"
            }`}
          />
          <p className="flex-1 text-sm font-semibold leading-snug">{t.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss"
            className="-m-1 shrink-0 cursor-pointer rounded p-1 text-gz-muted transition-colors gz-fast ease-gz-out hover:text-gz-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy/40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
