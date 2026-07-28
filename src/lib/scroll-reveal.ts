"use client";

// Attribute-driven reveal-on-scroll.
//
// The point of driving this from an attribute rather than a <Reveal> wrapper
// component is that a server component can opt in with `data-reveal` and stay a
// server component — no new client boundary, no extra JavaScript per section.
// One observer covers the whole page.

const READY_ATTR = "data-reveal-ready";
const REVEALED_ATTR = "data-revealed";

/**
 * Marks the document as JS-capable. The CSS only hides [data-reveal] elements
 * while this flag is set, so if the bundle fails to load the content renders
 * normally instead of being stuck invisible.
 *
 * Called from an inline script in the root layout so it lands before first
 * paint — setting it here in an effect would let the un-hidden content paint
 * once and then jump.
 */
export function markRevealReady() {
  document.documentElement.setAttribute(READY_ATTR, "");
}

export function initScrollReveal(): () => void {
  const reveal = (element: Element) => element.setAttribute(REVEALED_ATTR, "");

  // Without IntersectionObserver, or with motion turned down, show everything
  // immediately rather than degrading to a blank page.
  if (
    typeof IntersectionObserver === "undefined" ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    document.querySelectorAll("[data-reveal]").forEach(reveal);
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        // Reveal is one-way: re-hiding on scroll-up is distracting and makes
        // the page feel unstable.
        observer.unobserve(entry.target);
      }
    },
    // Fires slightly before the element reaches the fold, so the animation is
    // already underway by the time it is properly in view.
    { rootMargin: "0px 0px -60px 0px", threshold: 0.01 },
  );

  const observe = () => {
    document
      .querySelectorAll(`[data-reveal]:not([${REVEALED_ATTR}])`)
      .forEach((element) => observer.observe(element));
  };

  observe();

  // Route changes swap the page contents under us; picking up new nodes keeps
  // the effect working after client-side navigation.
  const mutations = new MutationObserver(observe);
  mutations.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    mutations.disconnect();
  };
}
