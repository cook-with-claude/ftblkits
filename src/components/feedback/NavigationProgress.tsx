"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { begin, reset, useIsPending } from "@/lib/pending";
import { prefersReducedMotion } from "@/lib/motion";

// Below this, a navigation is fast enough that a progress bar would register as
// a flash of noise rather than as feedback. Above it, the user has started to
// wonder whether the click landed.
const APPEAR_AFTER_MS = 250;

// How far the bar creeps while waiting. It must never reach the end on its own:
// a bar that sits at 100% while nothing happens is worse than no bar.
const CEILING = 0.9;
const TRICKLE_MS = 220;

/**
 * Top-of-page indeterminate progress bar.
 *
 * A <Link> click is still a server round trip — the storefront routes are
 * cached rather than static, so a cold or expired entry renders on demand.
 * `loading.tsx` covers the page area; this covers the gap before it, and gives
 * back/forward navigations feedback too.
 *
 * Navigations are detected from the click rather than from a router event,
 * because the App Router exposes no navigation-start hook. Settlement is
 * detected from the pathname/search actually changing.
 */
export function NavigationProgress() {
  const pending = useIsPending();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState(0);
  const endRef = useRef<(() => void) | null>(null);

  // Start a pending slot when a click is going to cause a navigation. Capture
  // phase so it still runs if a handler further down calls stopPropagation.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      // Modified clicks open a new tab or window — this document never waits.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // A pure hash change or a link to the page you are already on does no
      // fetching, so there is nothing to report.
      if (url.href === window.location.href) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      endRef.current?.();
      endRef.current = begin();
    };

    const onPopState = () => {
      endRef.current?.();
      endRef.current = begin();
    };

    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  // The destination rendered: release the slot. reset() rather than just
  // end() so a navigation that somehow opened two slots still clears.
  useEffect(() => {
    endRef.current = null;
    reset();
  }, [pathname, searchParams]);

  // Release on unmount so a slot cannot outlive the component.
  useEffect(() => () => endRef.current?.(), []);

  // Mirrors `visible` for the effect's own use. Reading the state variable here
  // instead would put it in the dependency list, and this effect re-running on
  // its own output would re-arm the appear timer every 250ms — snapping the bar
  // back to its starting value forever instead of letting it creep forward.
  const shownRef = useRef(false);

  useEffect(() => {
    if (pending) {
      const reduced = prefersReducedMotion();
      const appear = setTimeout(() => {
        shownRef.current = true;
        setVisible(true);
        // Reduced motion gets a static bar: present and legible, not crawling.
        setValue(reduced ? CEILING : 0.25);
      }, APPEAR_AFTER_MS);

      if (reduced) return () => clearTimeout(appear);

      // Asymptotic creep — each tick closes a fraction of the remaining
      // distance, so it decelerates on its own and never reaches the ceiling.
      // The zero check keeps it parked until the bar is actually on screen.
      const trickle = setInterval(() => {
        setValue((current) => (current === 0 ? current : current + (CEILING - current) * 0.12));
      }, TRICKLE_MS);

      return () => {
        clearTimeout(appear);
        clearInterval(trickle);
      };
    }

    // Settled before the bar ever appeared: the navigation was fast enough that
    // showing anything would have been a flash of noise. This is the whole
    // anti-flicker guarantee.
    if (!shownRef.current) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    // Completing on the next frame rather than immediately guarantees the
    // browser has a previous value to transition the bar from.
    const raf = requestAnimationFrame(() => {
      setValue(1);
      timer = setTimeout(() => {
        shownRef.current = false;
        setVisible(false);
        setValue(0);
      }, 200);
    });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [pending]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 h-[3px]"
      style={{ zIndex: "var(--gz-z-progress)" }}
      role="progressbar"
      aria-hidden="true"
    >
      {/* scaleX rather than width so the browser can keep this on the
          compositor and never lay out the page while a request is in flight. */}
      <div
        className="gz-flagbar h-full w-full origin-left transition-transform ease-gz-out"
        style={{
          transform: `scaleX(${value})`,
          transitionDuration: value === 1 ? "var(--gz-dur-base)" : `${TRICKLE_MS}ms`,
        }}
      />
    </div>
  );
}
