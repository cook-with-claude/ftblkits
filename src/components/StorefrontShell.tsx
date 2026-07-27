import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CartPanel } from "@/components/cart/CartPanel";
import { getSections } from "@/lib/supabase/queries";

export async function StorefrontShell({ children }: { children: ReactNode }) {
  const result = await getSections();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-gz-navy focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to content
      </a>
      {/* On an outage this is [], and the header degrades to logo + All Kits +
          WhatsApp rather than failing the page. */}
      <Header sections={result.sections} />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
      <Footer sections={result.sections} />
      {/* Deliberately a sibling of <Header>, not a child: the header's
          backdrop-blur creates a containing block that would clip this
          fixed-position overlay to the header's own box. */}
      <CartPanel />
    </>
  );
}
