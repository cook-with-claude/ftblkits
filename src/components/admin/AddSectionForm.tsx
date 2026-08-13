"use client";

import { useState } from "react";
import type { AdminSection } from "@/lib/admin/types";
import { SECTION_LIMITS } from "@/lib/admin/validation";
import { NAV_GROUPS, NAV_GROUP_LABELS, isNavGroup, slugify } from "@/lib/sections";
import { createSection } from "./api";
import { Spinner } from "@/components/feedback/Spinner";

const fieldClass =
  "w-full rounded-lg border border-gz-border bg-gz-bg px-3 py-2 text-sm text-gz-text focus:border-gz-navy focus:outline-none focus:ring-2 focus:ring-gz-navy";
const labelClass = "block text-[11px] font-extrabold uppercase tracking-widest text-gz-muted";

const EMPTY = { label: "", slug: "", navGroup: "featured", sortOrder: "0", accent: "", description: "" };

function navGroupLabel(group: string): string {
  if (group === "featured") return "Featured (top-level link)";
  return isNavGroup(group) ? NAV_GROUP_LABELS[group] : group;
}

export function AddSectionForm({ onCreated }: { onCreated: (s: AdminSection) => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  // Once the slug is edited by hand, stop overwriting it from the name.
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Widened beyond the products form's input|textarea union because this form
  // has a <select>, which fires ChangeEvent<HTMLSelectElement>.
  const set =
    (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF((prev) => ({ ...prev, [k]: e.target.value }));

  const setLabel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const label = e.target.value;
    setF((prev) => ({ ...prev, label, slug: slugTouched ? prev.slug : slugify(label) }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createSection({
        label: f.label,
        slug: f.slug,
        navGroup: f.navGroup,
        sortOrder: Number(f.sortOrder) || 0,
        accent: f.accent.trim() ? f.accent.trim().toLowerCase() : null,
        description: f.description.trim() ? f.description.trim() : null,
        hidden: false,
      });
      onCreated(created);
      setF(EMPTY);
      setSlugTouched(false);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add section");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full cursor-pointer rounded-xl border-2 border-dashed border-gz-border px-4 py-5 text-sm font-extrabold uppercase tracking-wide text-gz-navy transition-colors gz-base ease-gz-out hover:border-gz-navy/40 hover:bg-gz-bg-alt"
      >
        + Add a new section
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-gz-border bg-gz-surface p-4">
      <p className="font-[family-name:var(--font-display)] text-lg uppercase text-gz-navy">
        New section
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name</label>
          <input
            className={fieldClass}
            value={f.label}
            onChange={setLabel}
            maxLength={SECTION_LIMITS.label}
            placeholder="Serie A"
            required
          />
        </div>
        <div>
          <label className={labelClass}>Page URL</label>
          <input
            className={fieldClass}
            value={f.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug")(e);
            }}
            maxLength={SECTION_LIMITS.slug}
            placeholder="serie-a"
            required
          />
          <p className="mt-1 text-[11px] text-gz-muted">/kits/{f.slug || "…"}</p>
        </div>
        <div>
          <label className={labelClass}>Menu group</label>
          <select className={fieldClass} value={f.navGroup} onChange={set("navGroup")}>
            {NAV_GROUPS.map((group) => (
              <option key={group} value={group}>
                {navGroupLabel(group)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Order</label>
          <input
            className={fieldClass}
            type="number"
            min="0"
            max="10000"
            value={f.sortOrder}
            onChange={set("sortOrder")}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Accent colour</label>
          <div className="flex gap-2">
            <input
              type="color"
              aria-label="Pick accent colour"
              value={/^#[0-9a-f]{6}$/i.test(f.accent) ? f.accent : "#1e2a78"}
              onChange={(e) => setF((prev) => ({ ...prev, accent: e.target.value.toLowerCase() }))}
              className="h-[38px] w-12 shrink-0 cursor-pointer rounded-lg border border-gz-border bg-gz-bg"
            />
            <input
              className={fieldClass}
              value={f.accent}
              onChange={set("accent")}
              placeholder="Leave empty for default"
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input
            className={fieldClass}
            value={f.description}
            onChange={set("description")}
            maxLength={SECTION_LIMITS.description}
            placeholder="Shown on the section page"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-bold text-gz-red">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="flex min-h-[44px] min-w-[148px] cursor-pointer items-center justify-center gap-2 rounded-full bg-gz-navy px-5 py-2.5 text-sm font-extrabold text-white transition-opacity gz-base ease-gz-out hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy && <Spinner />}
          {busy ? "Adding…" : "Add section"}
        </button>
        <button
          type="button"
          onClick={() => {
            setF(EMPTY);
            setSlugTouched(false);
            setError(null);
            setOpen(false);
          }}
          className="min-h-[44px] cursor-pointer px-2 text-sm font-bold text-gz-muted hover:text-gz-navy"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
