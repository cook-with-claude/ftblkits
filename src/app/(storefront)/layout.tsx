import { StorefrontShell } from "@/components/StorefrontShell";

// Every storefront page needs the nav, and Header is a client component (drawer
// and dropdown state), so the sections are fetched once here and passed down
// rather than re-fetched by each page. /admin and /api sit outside this group so
// they never pay for the query.
export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
