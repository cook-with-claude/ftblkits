import { Skeleton } from "@/components/skeletons/Skeleton";

export default function Loading() {
  return (
    // Matches the real page: the order bar is a mobile-only overlay now, and
    // only once the inline CTA has scrolled away, so the clearance it needs is
    // gone above md.
    <div className="pb-28 md:pb-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mt-5">
          <Skeleton className="h-5 w-20" />
        </div>

        <div className="mt-4 grid gap-8 md:grid-cols-2 md:items-start">
          <Skeleton className="aspect-square w-full rounded-3xl" />

          <div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-9 w-4/5 sm:h-10" />
            <Skeleton className="mt-3 h-7 w-24" />

            <div className="mt-4">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="mt-2 h-3.5 w-full" />
              <Skeleton className="mt-2 h-3.5 w-2/3" />
            </div>

            {/* Size picker: label plus a row of size buttons. */}
            <div className="mt-6">
              <div className="flex items-baseline justify-between gap-3">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-16" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-12 w-14 rounded-xl" />
                ))}
              </div>
            </div>

            {/* The order buttons sit inline under the picker now, so this is
                where they belong in the skeleton — the fixed bar is no longer
                part of the first paint. */}
            <div className="mt-6 flex gap-2">
              <Skeleton className="h-12 flex-1 rounded-full" />
              <Skeleton className="h-12 flex-1 rounded-full" />
            </div>

            <Skeleton className="mt-6 h-1 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
