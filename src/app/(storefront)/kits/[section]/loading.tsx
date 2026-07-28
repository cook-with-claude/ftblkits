import {
  CatalogFiltersSkeleton,
  KitGridSkeleton,
  PageHeadingSkeleton,
  Skeleton,
} from "@/components/skeletons/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      {/* Reserves the "All kits" back-link row. */}
      <Skeleton className="h-5 w-20" />
      <div className="mt-4">
        <PageHeadingSkeleton />
      </div>
      <div className="mt-8">
        <CatalogFiltersSkeleton chips={4} />
        <div className="mt-4">
          <KitGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
