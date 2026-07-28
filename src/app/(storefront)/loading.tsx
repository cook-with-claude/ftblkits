import { KitGridSkeleton, Skeleton } from "@/components/skeletons/Skeleton";

export default function Loading() {
  return (
    <>
      {/* Hero: copy column plus the featured kit card. */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 pt-10 md:grid-cols-2 md:items-center">
        <div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-12 w-full sm:h-16" />
          <Skeleton className="mt-2 h-12 w-4/5 sm:h-16" />
          <div className="mt-5 max-w-md">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="mt-2 h-3.5 w-2/3" />
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Skeleton className="h-12 w-40 rounded-full" />
            <Skeleton className="h-12 w-32 rounded-full" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[360px]">
          <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
        </div>
      </section>

      {/* Section directory. */}
      <div className="mx-auto max-w-6xl px-4 pt-14">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="mt-1 h-1 w-16 rounded-full" />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* New arrivals. */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-8 w-56" />
        <Skeleton className="mt-1 h-1 w-16 rounded-full" />
        <div className="mt-5">
          <KitGridSkeleton count={8} />
        </div>
      </section>
    </>
  );
}
