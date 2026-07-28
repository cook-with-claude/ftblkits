import { Skeleton } from "@/components/skeletons/Skeleton";

export default function Loading() {
  return (
    // pb-28 matches the real page: the order bar is fixed, and this is what
    // keeps the last line of copy clear of it.
    <div className="pb-28">
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
              <Skeleton className="h-3.5 w-20" />
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-12 w-14 rounded-xl" />
                ))}
              </div>
            </div>

            <Skeleton className="mt-6 h-1 w-16 rounded-full" />
          </div>
        </div>
      </div>

      {/* The fixed order bar is part of this page's furniture, so it is part of
          the skeleton too — otherwise it pops in late over the content. */}
      <div
        className="fixed inset-x-0 bottom-0 border-t border-gz-border bg-gz-bg/95 p-4 backdrop-blur"
        style={{ zIndex: "var(--gz-z-sticky)" }}
      >
        <div className="mx-auto flex max-w-6xl gap-2">
          <Skeleton className="h-12 flex-1 rounded-full" />
          <Skeleton className="h-12 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}
