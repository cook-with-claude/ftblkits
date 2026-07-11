"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gz-bg px-4 text-center">
      <div className="max-w-lg">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gz-red">Temporary problem</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl uppercase text-gz-navy">
          We could not load this kit
        </h1>
        <p className="mt-4 text-gz-body">Please try again. Your order has not been submitted.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 cursor-pointer rounded-full bg-gz-navy px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-white"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
