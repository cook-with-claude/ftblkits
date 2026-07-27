"use client";

import type { AdminSection } from "@/lib/admin/types";
import { NAV_GROUP_LABELS, isNavGroup } from "@/lib/sections";

const labelClass = "block text-[11px] font-extrabold uppercase tracking-widest text-gz-muted";

function groupLabel(navGroup: string): string {
  if (isNavGroup(navGroup) && navGroup !== "featured") return NAV_GROUP_LABELS[navGroup];
  return navGroup === "featured" ? "Featured" : navGroup;
}

// A checkbox chip grid rather than <select multiple>, which is close to unusable
// on a phone -- where the owner actually manages stock.
export function SectionPicker({
  sections,
  selected,
  onChange,
}: {
  sections: AdminSection[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (slug: string) => {
    onChange(selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug]);
  };

  // Slugs on the kit that no longer match a section -- possible because the
  // array has no foreign key. Shown so they can be cleared, not hidden.
  const known = new Set(sections.map((s) => s.slug));
  const orphans = selected.filter((slug) => !known.has(slug));

  const grouped = sections.reduce<Record<string, AdminSection[]>>((acc, section) => {
    (acc[section.navGroup] ??= []).push(section);
    return acc;
  }, {});

  return (
    <div>
      <span className={labelClass}>Sections</span>
      <p className="mt-1 text-[11px] text-gz-muted">
        A kit can be in several at once — a club shirt might be in its league and a cup.
      </p>

      <div className="mt-2 space-y-3">
        {Object.entries(grouped).map(([navGroup, items]) => (
          <div key={navGroup}>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gz-muted/70">
              {groupLabel(navGroup)}
            </span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {items.map((section) => {
                const isOn = selected.includes(section.slug);
                return (
                  <label
                    key={section.id}
                    className={`flex min-h-[36px] cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors duration-200 ${
                      isOn
                        ? "border-gz-navy bg-gz-navy text-white"
                        : "border-gz-border bg-gz-bg text-gz-navy hover:border-gz-navy/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggle(section.slug)}
                      className="h-3.5 w-3.5 cursor-pointer"
                    />
                    {section.label}
                    {section.hidden && (
                      <span className={isOn ? "text-white/60" : "text-gz-muted"}>(hidden)</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {orphans.length > 0 && (
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gz-red">
              Unknown
            </span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {orphans.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => toggle(slug)}
                  className="flex min-h-[36px] cursor-pointer items-center gap-2 rounded-full border border-gz-red/40 bg-gz-red/5 px-3 py-1.5 text-xs font-bold text-gz-red"
                >
                  {slug} ✕
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
