"use client";

import { ErrorState } from "@/components/ErrorState";

// Scoped to the storefront route group so it renders *inside* StorefrontShell.
// Without it, a throw from /kits, /kits/[section] or /jersey/[id] fell through
// to the root boundary, which replaced the header, nav, cart and footer with a
// bare centred message — the failure looked far worse than it was, and there
// was no way back other than the browser's back button.
export default function StorefrontError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState reset={reset} />;
}
