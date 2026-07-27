"use client";

import { useState } from "react";
import type { AdminSection } from "@/lib/admin/types";
import { SECTION_LIMITS } from "@/lib/admin/validation";
import { NAV_GROUPS, NAV_GROUP_LABELS, isNavGroup } from "@/lib/sections";
import { deleteSection, updateSection } from "./api";

const fieldClass =
  "w-full rounded-lg border border-gz-border bg-gz-bg px-3 py-2 text-sm text-gz-text focus:border-gz-navy focus:outline-none focus:ring-2 focus:ring-gz-navy/30";
const labelClass = "block text-[11px] font-extrabold uppercase tracking-widest text-gz-muted";

function navGroupLabel(group: string): string {
  if (group === "featured") return "Featured (top-level link)";
  return isNavGroup(group) ? NAV_GROUP_LABELS[group] : group;
}

export function SectionRow({
  section,
  kitCount,
  onChange,
  onRemove,
}: {
  section: AdminSection;
  kitCount: number;
  onChange: (s: AdminSection) => void;
  onRemove: (id: string) => void;
}) {
  const [label, setLabel] = useState(section.label);
  const [slug, setSlug] = useState(section.slug);
  const [navGroup, setNavGroup] = useState(section.navGroup);
  const [sortOrder, setSortOrder] = useState(String(section.sortOrder));
  const [accent, setAccent] = useState(section.accent ?? "");
  const [description, setDescription] = useState(section.description ?? "");
  const [hidden, setHidden] = useState(section.hidden);

  // The slug is the public URL. Locked behind an explicit toggle so it can't be
  // changed by accident -- changing it breaks every existing link to the section.
  const [editingSlug, setEditingSlug] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "delete">(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const save = async () => {
    setBusy("save");
    setMsg(null);
    try {
      const updated = await updateSection(section.id, {
        label,
        slug,
        navGroup,
        sortOrder: Number(sortOrder),
        accent: accent.trim() ? accent.trim().toLowerCase() : null,
        description: description.trim() ? description.trim() : null,
        hidden,
      });
      onChange(updated);
      setSlug(updated.slug);
      setEditingSlug(false);
      setMsg({ kind: "ok", text: "Saved." });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Could not save" });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    const warning =
      kitCount > 0
        ? `Delete "${section.label}"? It will be removed from ${kitCount} kit${kitCount === 1 ? "" : "s"}. The kits themselves are kept.`
        : `Delete "${section.label}"? This cannot be undone.`;
    if (!confirm(warning)) return;

    setBusy("delete");
    setMsg(null);
    try {
      await deleteSection(section.id);
      onRemove(section.id);
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Could not delete" });
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-gz-border bg-gz-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-8 w-1.5 shrink-0 rounded-full"
            style={{ background: accent.trim() || "var(--gz-navy)" }}
          />
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg uppercase leading-none text-gz-navy">
              {label || "Untitled"}
            </p>
            <p className="mt-1 text-xs text-gz-muted">
              /kits/{slug} · {kitCount} kit{kitCount === 1 ? "" : "s"}
              {hidden && <span className="ml-1 font-bold text-gz-red">· hidden</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name</label>
          <input
            className={fieldClass}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={SECTION_LIMITS.label}
          />
        </div>
        <div>
          <label className={labelClass}>Menu group</label>
          <select
            className={fieldClass}
            value={navGroup}
            onChange={(e) => setNavGroup(e.target.value)}
          >
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
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Accent colour</label>
          <div className="flex gap-2">
            <input
              type="color"
              aria-label="Pick accent colour"
              value={/^#[0-9a-f]{6}$/i.test(accent) ? accent : "#1e2a78"}
              onChange={(e) => setAccent(e.target.value.toLowerCase())}
              className="h-[38px] w-12 shrink-0 cursor-pointer rounded-lg border border-gz-border bg-gz-bg"
            />
            <input
              className={fieldClass}
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              placeholder="#1e2a78 — leave empty for default"
            />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <label className={labelClass}>Description</label>
        <textarea
          className={`${fieldClass} min-h-16`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={SECTION_LIMITS.description}
        />
      </div>

      <div className="mt-3">
        <label className={labelClass}>Page URL</label>
        {editingSlug ? (
          <>
            <input
              className={fieldClass}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              maxLength={SECTION_LIMITS.slug}
            />
            <p className="mt-1 text-[11px] font-bold text-gz-red">
              Changing this breaks any existing link to /kits/{section.slug}.
            </p>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <code className="rounded bg-gz-bg-alt px-2 py-1 text-sm text-gz-navy">/kits/{slug}</code>
            <button
              type="button"
              onClick={() => setEditingSlug(true)}
              className="cursor-pointer text-xs font-bold text-gz-navy underline hover:text-gz-red"
            >
              Change URL
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gz-navy">
          <input
            type="checkbox"
            checked={hidden}
            onChange={(e) => setHidden(e.target.checked)}
            className="h-4 w-4 cursor-pointer"
          />
          Hidden from shop
        </label>

        <button
          type="button"
          onClick={save}
          disabled={busy !== null}
          className="min-h-[44px] cursor-pointer rounded-full bg-gz-navy px-5 py-2.5 text-sm font-extrabold text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
        >
          {busy === "save" ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={busy !== null}
          className="min-h-[44px] cursor-pointer rounded-full border border-gz-red px-5 py-2.5 text-sm font-extrabold text-gz-red transition-colors duration-200 hover:bg-gz-red hover:text-white disabled:opacity-50"
        >
          {busy === "delete" ? "Deleting…" : "Delete"}
        </button>

        {msg && (
          <span
            role="status"
            className={`text-sm font-bold ${msg.kind === "ok" ? "text-gz-green" : "text-gz-red"}`}
          >
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
