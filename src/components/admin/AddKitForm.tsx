"use client";

import { useState } from "react";
import Image from "next/image";
import type { AdminProduct } from "@/lib/admin/types";
import { createProduct, uploadImage } from "./api";

const fieldClass =
  "w-full rounded-lg border border-gz-border bg-gz-bg px-3 py-2 text-sm text-gz-text focus:border-gz-navy focus:outline-none focus:ring-2 focus:ring-gz-navy/30";
const labelClass = "block text-[11px] font-extrabold uppercase tracking-widest text-gz-muted";

const EMPTY = { name: "", country: "", price: "", sizes: "", description: "" };

export function AddKitForm({ onCreated }: { onCreated: (p: AdminProduct) => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isMystery, setIsMystery] = useState(false);
  const [busy, setBusy] = useState<null | "upload" | "create">(null);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("upload");
    setError(null);
    try {
      setImageUrl(await uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(null);
      e.target.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setError(null);
    try {
      const created = await createProduct({
        name: f.name,
        country: f.country,
        price: Number(f.price),
        sizes: f.sizes.split(",").map((s) => s.trim()).filter(Boolean),
        description: f.description.trim() ? f.description.trim() : null,
        imageUrl,
        inStock: true,
        hidden: false,
        isMystery,
      });
      onCreated(created);
      setF(EMPTY);
      setImageUrl(null);
      setIsMystery(false);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add kit");
    } finally {
      setBusy(null);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full cursor-pointer rounded-2xl border-2 border-dashed border-gz-border py-4 text-sm font-extrabold uppercase tracking-wide text-gz-navy transition-colors duration-200 hover:border-gz-navy/40 hover:bg-gz-surface"
      >
        + Add a new kit
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gz-navy/30 bg-gz-surface p-4">
      <h3 className="font-[family-name:var(--font-display)] text-lg uppercase text-gz-navy">New kit</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name</label>
          <input className={fieldClass} value={f.name} onChange={set("name")} required />
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <input className={fieldClass} value={f.country} onChange={set("country")} required />
        </div>
        <div>
          <label className={labelClass}>Price ($)</label>
          <input className={fieldClass} type="number" min="0" step="1" value={f.price} onChange={set("price")} required />
        </div>
        <div>
          <label className={labelClass}>Sizes (comma separated)</label>
          <input className={fieldClass} value={f.sizes} onChange={set("sizes")} placeholder="S, M, L, XL" />
        </div>
      </div>
      <div className="mt-3">
        <label className={labelClass}>Description</label>
        <textarea className={`${fieldClass} min-h-16`} value={f.description} onChange={set("description")} />
      </div>
      <div className="mt-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gz-navy">
          <input
            type="checkbox"
            checked={isMystery}
            onChange={(e) => setIsMystery(e.target.checked)}
            className="h-4 w-4 cursor-pointer"
          />
          Mystery kit
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          {imageUrl && (
            <span className="relative h-14 w-14 overflow-hidden rounded-lg border border-gz-border">
              <Image src={imageUrl} alt="preview" fill sizes="56px" className="object-cover" />
            </span>
          )}
          <label className={labelClass}>
            Photo
            <input
              type="file"
              accept="image/*"
              onChange={onPickImage}
              disabled={busy === "upload"}
              className="mt-1 block cursor-pointer text-sm font-normal normal-case tracking-normal text-gz-body file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gz-navy file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:text-white"
            />
          </label>
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-bold text-gz-red">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          className="cursor-pointer rounded-full border border-gz-border px-5 py-2 text-sm font-bold text-gz-navy transition-colors duration-200 hover:bg-gz-bg-alt"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy !== null}
          className="cursor-pointer rounded-full bg-gz-green px-5 py-2 text-sm font-extrabold uppercase tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "create" ? "Adding…" : busy === "upload" ? "Uploading…" : "Add kit"}
        </button>
      </div>
    </form>
  );
}
