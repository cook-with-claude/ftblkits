import { StorefrontNotFoundContent } from "@/components/StorefrontNotFound";

// Lives inside the (storefront) group so a 404 keeps the real header, nav and
// footer instead of falling back to Next's bare default page.
export default function StorefrontNotFound() {
  return <StorefrontNotFoundContent />;
}
