"use client";

import { useEffect, useState } from "react";

/**
 * Names the problem when the network drops.
 *
 * Without this, losing connectivity is indistinguishable from the site being
 * broken: clicks do nothing and no error ever arrives, because the request
 * never leaves the device.
 */
export function OfflineBanner() {
  // Starts optimistic. navigator.onLine is unavailable during SSR, and
  // rendering "offline" on the server would flash the banner on every load.
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    // Normal flow, not sticky. The header is already sticky at top-0, and a
    // second sticky element at the same offset simply covers it. This is the
    // announcement-bar pattern: visible on arrival, then it scrolls away and
    // hands the top of the viewport back to the nav. Requests that fail while
    // scrolled down still surface through the toaster.
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-gz-red px-4 py-2 text-center text-xs font-extrabold uppercase tracking-wide text-white"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M1 1l22 22M8.5 16.5a5 5 0 017 0M5 13a10 10 0 013.5-2.3M19 13a10 10 0 00-9-2.9M2 8.8A15 15 0 0110 6.1M22 8.8a15 15 0 00-5-2.4" strokeLinecap="round" />
        <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
      </svg>
      You are offline — check your connection
    </div>
  );
}
