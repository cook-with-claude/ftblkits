"use client";

import type { AdminProduct, AdminSection } from "@/lib/admin/types";
import { NAV_GROUPS, NAV_GROUP_LABELS, isNavGroup } from "@/lib/sections";
import { AddSectionForm } from "./AddSectionForm";
import { SectionRow } from "./SectionRow";

function navGroupLabel(group: string): string {
  if (group === "featured") return "Featured — top-level links";
  return isNavGroup(group) ? NAV_GROUP_LABELS[group] : group;
}

export function SectionsPanel({
  sections,
  products,
  onCreated,
  onChange,
  onRemove,
}: {
  sections: AdminSection[] | null;
  products: AdminProduct[] | null;
  onCreated: (s: AdminSection) => void;
  onChange: (s: AdminSection) => void;
  onRemove: (id: string) => void;
}) {
  if (sections === null) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-gz-border bg-gz-bg-alt"
          />
        ))}
      </div>
    );
  }

  // Counted from the products the dashboard already holds — no extra query, and
  // it is how the owner spots sections with nothing in them.
  const countFor = (slug: string) =>
    (products ?? []).filter((p) => p.sections.includes(slug)).length;

  // Unknown groups can only appear if the DB CHECK gains a value the code has
  // not shipped yet; render them last rather than dropping the sections.
  const groups = [
    ...NAV_GROUPS.filter((g) => sections.some((s) => s.navGroup === g)),
    ...[...new Set(sections.map((s) => s.navGroup))].filter(
      (g) => !(NAV_GROUPS as readonly string[]).includes(g),
    ),
  ];

  return (
    <div className="space-y-8">
      <AddSectionForm onCreated={onCreated} />

      <p className="text-sm text-gz-body">
        Sections are the pages of the shop. Each one gets its own page at{" "}
        <code className="rounded bg-gz-bg-alt px-1.5 py-0.5 text-xs">/kits/…</code> and appears in
        the menu. Hidden sections stay here but disappear from the site.
      </p>

      {groups.map((group) => {
        const items = sections.filter((s) => s.navGroup === group);
        if (items.length === 0) return null;
        return (
          <section key={group}>
            <h2 className="font-[family-name:var(--font-display)] text-xl uppercase text-gz-navy">
              {navGroupLabel(group)}
            </h2>
            <div className="mt-3 space-y-3">
              {items.map((section) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  kitCount={countFor(section.slug)}
                  onChange={onChange}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </section>
        );
      })}

      {sections.length === 0 && (
        <p className="rounded-xl border border-dashed border-gz-border bg-gz-bg-alt px-4 py-10 text-center text-sm text-gz-muted">
          No sections yet. Add one above to start organising the shop.
        </p>
      )}
    </div>
  );
}
