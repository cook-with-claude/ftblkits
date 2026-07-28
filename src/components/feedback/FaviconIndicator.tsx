"use client";

import { useEffect } from "react";
import { useIsPending } from "@/lib/pending";
import { prefersReducedMotion } from "@/lib/motion";

// Longer than the progress bar's delay. The bar is in the page, where a brief
// flash is cheap; the tab icon is chrome the user may be looking at from
// another tab entirely, so it should only change for waits that are real.
const APPEAR_AFTER_MS = 400;

const SIZE = 32;
const FRAME_MS = 80;
const SPIN_MS = 900;

// Brand tri-colour, cycled so the spinner reads as ours rather than as a
// generic loader. Matches --gz-navy / --gz-red / --gz-green.
const STROKES = ["#1e2a78", "#e10600", "#00a86b"];
const TRACK = "rgba(30, 42, 120, 0.18)";

function draw(ctx: CanvasRenderingContext2D, elapsed: number) {
  const centre = SIZE / 2;
  const radius = centre - 4;

  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  ctx.strokeStyle = TRACK;
  ctx.beginPath();
  ctx.arc(centre, centre, radius, 0, Math.PI * 2);
  ctx.stroke();

  const turns = elapsed / SPIN_MS;
  const start = turns * Math.PI * 2;
  // One colour per revolution.
  ctx.strokeStyle = STROKES[Math.floor(turns) % STROKES.length];
  ctx.beginPath();
  // 270° of arc — enough gap that the rotation is unmistakable at 16px, which
  // is the only size a favicon is ever actually seen at.
  ctx.arc(centre, centre, radius, start, start + Math.PI * 1.5);
  ctx.stroke();
}

/**
 * Replaces the favicon with a spinning arc while work is in flight, and puts
 * the real icon back when it settles.
 *
 * This exists because the app is a single-page app. A classic multi-page site
 * gets the browser's own tab spinner for free on every navigation; client-side
 * routing gets nothing, which is a large part of why a slow connection here
 * feels like a crash.
 */
export function FaviconIndicator() {
  const pending = useIsPending();

  useEffect(() => {
    if (!pending) return;

    let link: HTMLLinkElement | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let removal: ReturnType<typeof setTimeout> | undefined;

    const original = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    const originalHref = original?.href ?? "/icon.png";

    const start = setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Our own <link> rather than mutating the one Next generates: the last
      // icon declared wins, so appending overrides cleanly and removing hands
      // control straight back with nothing to restore.
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";

      const paint = (elapsed: number) => {
        draw(ctx, elapsed);
        if (link) link.href = canvas.toDataURL("image/png");
      };

      if (prefersReducedMotion()) {
        // A single static frame — still a clear "busy" signal, no animation.
        paint(0);
        document.head.appendChild(link);
        return;
      }

      const began = performance.now();
      paint(0);
      document.head.appendChild(link);

      // setInterval, not requestAnimationFrame: rAF is suspended entirely in a
      // background tab, which is exactly when a tab indicator matters most.
      // Background timers get clamped to ~1s, so the spinner keeps ticking
      // (slowly) while the user is looking at another tab.
      timer = setInterval(() => paint(performance.now() - began), FRAME_MS);
    }, APPEAR_AFTER_MS);

    return () => {
      clearTimeout(start);
      if (timer) clearInterval(timer);
      if (removal) clearTimeout(removal);
      if (!link) return;

      // Point at the real icon before detaching, so there is never a frame
      // where the tab has no valid icon to fall back to.
      link.href = originalHref;
      const detaching = link;
      removal = setTimeout(() => detaching.remove(), 100);
    };
  }, [pending]);

  return null;
}
