import Link from "next/link";

export function StorefrontNotFoundContent() {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gz-red">404</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl uppercase text-gz-navy">
        We could not find that page
      </h1>
      <p className="mt-4 max-w-md text-gz-body">
        The kit or section you were looking for may have sold out or moved.
      </p>
      <Link
        href="/kits"
        className="mt-7 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gz-red px-7 py-3.5 text-sm font-extrabold uppercase tracking-wide text-white transition-all gz-base ease-gz-out hover:-translate-y-0.5"
      >
        Browse all kits →
      </Link>
    </div>
  );
}
