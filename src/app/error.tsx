"use client";

import { ErrorState } from "@/components/ErrorState";

// The root boundary is now the last resort: anything thrown inside the
// storefront route group is caught by (storefront)/error.tsx first, which keeps
// the branded shell around the message.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gz-bg px-4">
      <ErrorState reset={reset} />
    </main>
  );
}
