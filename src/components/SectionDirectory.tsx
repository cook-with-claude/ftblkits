import Link from "next/link";
import { groupSections, sectionAccent, sectionHref, type Section } from "@/lib/sections";

// The old "Shop by Country" chip row, reborn as links to real pages. The chips
// used to be buttons that set client state and scrolled; each one is now a route.
export function SectionDirectory({
  sections,
  counts,
  headingLevel = "h2",
}: {
  sections: Section[];
  counts?: Record<string, number>;
  headingLevel?: "h2" | "h3";
}) {
  const groups = groupSections(sections);
  if (groups.length === 0) return null;

  const Heading = headingLevel;

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.group}>
          <Heading className="font-[family-name:var(--font-display)] text-2xl uppercase text-gz-navy sm:text-3xl">
            {group.label ?? "Featured"}
          </Heading>
          <div className="mt-1 h-1 w-16 rounded-full gz-flag-gradient" aria-hidden="true" />

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.sections.map((section) => {
              const count = counts?.[section.slug];
              return (
                <Link
                  key={section.id}
                  href={sectionHref(section.slug)}
                  className="group relative flex min-h-[44px] cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-xl border border-gz-border bg-gz-surface px-4 py-4 transition-colors duration-200 hover:border-gz-navy/40 hover:bg-gz-bg-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy/40"
                >
                  {/* Accent edge — the only per-section colour on this card, so a
                      badly chosen hex can never sit behind text. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ background: sectionAccent(section) }}
                  />
                  <span className="pl-2">
                    <span className="block font-[family-name:var(--font-display)] text-lg uppercase leading-none text-gz-navy">
                      {section.label}
                    </span>
                    {section.description && (
                      <span className="mt-1 block text-xs leading-relaxed text-gz-muted">
                        {section.description}
                      </span>
                    )}
                  </span>
                  {count !== undefined && (
                    <span className="shrink-0 rounded-full bg-gz-bg-alt px-2.5 py-1 text-xs font-extrabold text-gz-muted">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
