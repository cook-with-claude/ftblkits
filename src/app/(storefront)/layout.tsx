import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSections } from "@/lib/supabase/queries";

// Every storefront page needs the nav, and Header is a client component (drawer
// and dropdown state), so the sections are fetched once here and passed down
// rather than re-fetched by each page. /admin and /api sit outside this group so
// they never pay for the query.
export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await getSections();

  return (
    <>
      {/* The nav is long once the dropdowns fill up; let keyboard users skip it. */}
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
    </>
  );
}
