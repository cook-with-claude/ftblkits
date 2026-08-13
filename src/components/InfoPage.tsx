import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared chrome for the information pages — /faq, /about, /contact, /privacy,
 * /terms. They are prose, not catalog, so they share a narrower measure than
 * the grid pages and none of the filter furniture.
 */
export function InfoPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase text-gz-navy sm:text-4xl">
        {title}
      </h1>
      <div className="mt-1 h-1 w-16 rounded-full gz-flag-gradient" aria-hidden="true" />
      {intro && <p className="mt-4 text-base leading-relaxed text-gz-body">{intro}</p>}
      <div className="mt-8 space-y-8">{children}</div>
    </div>
  );
}

export function InfoSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-xl uppercase text-gz-navy">
        {heading}
      </h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-gz-body">{children}</div>
    </section>
  );
}

export function InfoLink({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith("http") || href.startsWith("tel:");
  const className =
    "cursor-pointer font-bold text-gz-navy underline underline-offset-2 transition-colors gz-base ease-gz-out hover:text-gz-red";

  if (external) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
