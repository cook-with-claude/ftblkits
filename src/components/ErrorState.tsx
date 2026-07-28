"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/feedback/Spinner";

/**
 * Shared body for the error boundaries.
 *
 * The retry is wrapped in a transition so the button can say it is working.
 * Retrying re-renders the segment on the server, which on a bad connection is
 * exactly as slow as the request that failed — an inert button through that
 * wait is what made the site feel broken in the first place.
 *
 * reset() on its own is not enough. It only clears the boundary's error state;
 * the router still holds the payload that threw, so React re-renders the exact
 * same failure and the button can never succeed however healthy the server has
 * become. refresh() is what discards that payload and asks the server again —
 * without it "Try again" is decorative, and only a full page reload recovers.
 */
export function ErrorState({ reset }: { reset: () => void }) {
  const [retrying, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gz-red">
        Temporary problem
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl uppercase text-gz-navy">
        We could not load this page
      </h1>
      <p className="mt-4 max-w-lg text-gz-body">
        This is usually a slow or dropped connection. Your order has not been submitted.
      </p>
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            router.refresh();
            reset();
          })
        }
        disabled={retrying}
        className="mt-6 flex min-w-[168px] cursor-pointer items-center justify-center gap-2 rounded-full bg-gz-navy px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition-opacity gz-base ease-gz-out hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {retrying && <Spinner />}
        {retrying ? "Retrying…" : "Try again"}
      </button>
    </div>
  );
}
