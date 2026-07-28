import { Skeleton } from "@/components/skeletons/Skeleton";

// /admin verifies the session cookie server-side before it can decide whether
// to render the dashboard or the login form, so there is a real wait here even
// though no catalog query is involved.
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-8 flex gap-2">
        <Skeleton className="h-11 w-28 rounded-lg" />
        <Skeleton className="h-11 w-32 rounded-lg" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
