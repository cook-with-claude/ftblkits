import { StorefrontNotFoundContent } from "@/components/StorefrontNotFound";
import { StorefrontShell } from "@/components/StorefrontShell";

// A URL that matches no route never enters the (storefront) route group, so its
// group-level not-found file cannot provide the branded shell.
//
// The shell fetches the section list for the nav, which is the only reason this
// was ever dynamic. Cached like the rest of the storefront, and purged by the
// same admin write, so a renamed section does not linger in a 404's nav.
export const revalidate = 300;

export default async function RootNotFound() {
  return (
    <StorefrontShell>
      <StorefrontNotFoundContent />
    </StorefrontShell>
  );
}
