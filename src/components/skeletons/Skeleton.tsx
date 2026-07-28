// Skeleton primitives for route-level loading.tsx files.
//
// These are server components with no interactivity — they exist purely so a
// navigation paints something structural immediately instead of leaving the
// previous page on screen while the server works.
//
// The rule they all follow: match the real layout's box sizes. A skeleton whose
// proportions differ from the content that replaces it trades one kind of jank
// for another.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`gz-skeleton rounded-lg ${className}`} aria-hidden="true" />;
}

/** Mirrors JerseyCard: square image, team line, name, price row. */
export function KitCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gz-border bg-gz-surface">
      <div className="gz-skeleton aspect-square w-full" aria-hidden="true" />
      <div className="p-3">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="mt-2 h-4 w-4/5" />
        <div className="mt-3 flex items-center justify-between gap-2">
          <Skeleton className="h-3.5 w-10" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
    </div>
  );
}

/** Same grid columns as CatalogFilters and the arrivals grid, so nothing reflows. */
export function KitGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <KitCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Team chips are real words of varying length; uniform pills read as a loading
// bar rather than as a row of filters.
const CHIP_WIDTHS = ["w-24", "w-20", "w-28", "w-16", "w-24", "w-20"];

/** Search input + in-stock toggle + team chips, matching CatalogFilters. */
export function CatalogFiltersSkeleton({ chips = 6 }: { chips?: number }) {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-[50px] flex-1 rounded-xl" />
        <Skeleton className="h-[50px] w-full rounded-xl sm:w-32" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: chips }, (_, i) => (
          <Skeleton key={i} className={`h-11 rounded-full ${CHIP_WIDTHS[i % CHIP_WIDTHS.length]}`} />
        ))}
      </div>
      <div className="mt-4">
        <Skeleton className="h-4 w-20" />
      </div>
    </>
  );
}

/** The heading + accent rule + intro paragraph every catalog page opens with. */
export function PageHeadingSkeleton({ withIntro = true }: { withIntro?: boolean }) {
  return (
    <>
      <Skeleton className="h-9 w-56 sm:h-10 sm:w-72" />
      <Skeleton className="mt-1 h-1 w-16 rounded-full" />
      {withIntro && (
        <div className="mt-3 max-w-xl">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="mt-2 h-3.5 w-3/4" />
        </div>
      )}
    </>
  );
}
