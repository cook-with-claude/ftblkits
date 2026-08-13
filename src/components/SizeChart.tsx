"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { lockBodyScroll, useDisclosureTransition } from "@/lib/motion";
import {
  cmToInches,
  fitsChestCm,
  sizeChartFor,
  SIZE_ADVICE,
  SIZE_DISCLAIMER,
  type SizeChart as SizeChartData,
} from "@/lib/sizing";

const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

// Matches --gz-dur-slow, same as the cart panel.
const TRANSITION_MS = 320;

function ChartTable({ chart }: { chart: SizeChartData }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          {chart.label} — approximate measurements in centimetres
        </caption>
        <thead>
          <tr className="border-b border-gz-border text-left">
            <th scope="col" className="py-2 pr-3 text-xs font-extrabold uppercase tracking-wide text-gz-muted">
              Size
            </th>
            <th scope="col" className="py-2 pr-3 text-xs font-extrabold uppercase tracking-wide text-gz-muted">
              Chest (flat)
            </th>
            <th scope="col" className="py-2 pr-3 text-xs font-extrabold uppercase tracking-wide text-gz-muted">
              Length
            </th>
            <th scope="col" className="py-2 text-xs font-extrabold uppercase tracking-wide text-gz-muted">
              Fits chest
            </th>
          </tr>
        </thead>
        <tbody>
          {chart.rows.map((row) => {
            const [low, high] = fitsChestCm(row);
            return (
              <tr key={row.size} className="border-b border-gz-border last:border-b-0">
                <th scope="row" className="py-2.5 pr-3 text-left font-extrabold text-gz-navy">
                  {row.size}
                </th>
                <td className="py-2.5 pr-3 text-gz-body">
                  {row.chestFlatCm} cm{" "}
                  <span className="text-gz-muted">({cmToInches(row.chestFlatCm)}″)</span>
                </td>
                <td className="py-2.5 pr-3 text-gz-body">
                  {row.bodyLengthCm} cm{" "}
                  <span className="text-gz-muted">({cmToInches(row.bodyLengthCm)}″)</span>
                </td>
                <td className="py-2.5 text-gz-body">
                  {low}–{high} cm
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * "Size guide" link plus its dialog. The modal mechanics — role, aria-modal,
 * focus trap, focus restoration, scroll lock, exit transition — deliberately
 * mirror CartPanel rather than introducing a second pattern.
 *
 * Unlike the cart, this one owns its trigger, so focus restoration is a ref
 * rather than a document query.
 */
export function SizeChart({ sections }: { sections: string[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const { mounted, entered } = useDisclosureTransition(open, TRANSITION_MS);

  const chart = sizeChartFor(sections);

  const onClose = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="cursor-pointer text-xs font-extrabold uppercase tracking-wide text-gz-navy underline decoration-gz-navy/40 underline-offset-4 transition-colors gz-base ease-gz-out hover:text-gz-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy"
      >
        Size guide
      </button>

      {mounted && (
        <div className="fixed inset-0" style={{ zIndex: "var(--gz-z-overlay)" }}>
          <div
            className={`absolute inset-0 bg-gz-navy-deep/50 backdrop-blur-[2px] transition-opacity gz-slow ease-gz-out ${
              entered ? "opacity-100" : "opacity-0"
            }`}
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-4">
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className={`flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-gz-bg shadow-[0_0_60px_-12px_rgba(0,0,0,0.5)] transition-[opacity,transform,translate] gz-slow sm:rounded-2xl ${
                entered
                  ? "translate-y-0 opacity-100 ease-gz-spring"
                  : "translate-y-4 opacity-0 ease-gz-in-out"
              }`}
            >
              <div className="gz-flagbar h-1 w-full shrink-0" aria-hidden="true" />

              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gz-border px-4 py-3">
                <h2
                  id={titleId}
                  className="font-[family-name:var(--font-display)] text-xl uppercase text-gz-navy"
                >
                  Size guide
                </h2>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close size guide"
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gz-border text-gz-navy transition-colors gz-base ease-gz-out hover:bg-gz-bg-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto px-4 py-4">
                <p className="rounded-xl border border-gz-navy/30 bg-gz-bg-alt px-3 py-2.5 text-sm font-bold leading-relaxed text-gz-navy">
                  {SIZE_ADVICE}
                </p>

                <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-gz-muted">
                  {chart.label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gz-body">{chart.note}</p>

                <div className="mt-3">
                  <ChartTable chart={chart} />
                </div>

                <p className="mt-4 text-xs leading-relaxed text-gz-muted">{SIZE_DISCLAIMER}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
