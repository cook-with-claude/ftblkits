import { StorefrontNotFoundContent } from "@/components/StorefrontNotFound";
import { StorefrontShell } from "@/components/StorefrontShell";

// A URL that matches no route never enters the (storefront) route group, so its
// group-level not-found file cannot provide the branded shell.
export const dynamic = "force-dynamic";

export default async function RootNotFound() {
  return (
    <StorefrontShell>
      <StorefrontNotFoundContent />
    </StorefrontShell>
  );
}
