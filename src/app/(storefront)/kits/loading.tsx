import {
  CatalogFiltersSkeleton,
  KitGridSkeleton,
  PageHeadingSkeleton,
} from "@/components/skeletons/Skeleton";

// Next renders this the instant the link is clicked, before any server work
// starts. It is the single largest contributor to the site feeling responsive
// on a slow connection: the layout arrives immediately and only the content
// waits.
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <PageHeadingSkeleton />
      <div className="mt-6">
        {/* Matches the real page, which hides team chips across all kits. */}
        <CatalogFiltersSkeleton chips={0} />
        <div className="mt-4">
          <KitGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
