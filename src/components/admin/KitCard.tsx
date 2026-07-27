"use client";

import { useState } from "react";
import Image from "next/image";
import type { AdminProduct, AdminSection } from "@/lib/admin/types";
import { deleteProduct, discardUploadedImage, updateProduct, uploadImage } from "./api";
import { PRODUCT_LIMITS } from "@/lib/admin/validation";
import { SectionPicker } from "./SectionPicker";

const fieldClass =
  "w-full rounded-lg border border-gz-border bg-gz-bg px-3 py-2 text-sm text-gz-text focus:border-gz-navy focus:outline-none focus:ring-2 focus:ring-gz-navy/30";
const labelClass = "block text-[11px] font-extrabold uppercase tracking-widest text-gz-muted";

export function KitCard({
  product,
  sections = [],
  onChange,
  onRemove,
}: {
  product: AdminProduct;
  sections?: AdminSection[];
  onChange: (p: AdminProduct) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState(product.name);
  const [team, setTeam] = useState(product.team);
  const [price, setPrice] = useState(String(product.price));
  const [sizes, setSizes] = useState(product.sizes.join(", "));
  const [description, setDescription] = useState(product.description ?? "");
  const [imageUrl, setImageUrl] = useState(product.imageUrl);
  const [inStock, setInStock] = useState(product.inStock);
  const [hidden, setHidden] = useState(product.hidden);
  const [isMystery, setIsMystery] = useState(product.isMystery);
  const [productSections, setProductSections] = useState<string[]>(product.sections);

  const [busy, setBusy] = useState<null | "save" | "upload" | "delete">(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("upload");
    setMsg(null);
    try {
      const previous = imageUrl;
      const url = await uploadImage(file);
      setImageUrl(url);
      if (previous && previous !== product.imageUrl) await discardUploadedImage(previous);
      setMsg({ kind: "ok", text: "Photo uploaded — click Save to keep it." });
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setBusy(null);
      e.target.value = "";
    }
  }

  async function save() {
    setBusy("save");
    setMsg(null);
    try {
      const updated = await updateProduct(product.id, {
        name,
        team,
        price: Number(price),
        sizes: sizes.split(",").map((s) => s.trim()).filter(Boolean),
        description: description.trim() ? description.trim() : null,
        imageUrl,
        inStock,
        hidden,
        isMystery,
        sections: productSections,
      });
      onChange(updated);
      setProductSections(updated.sections);
      setMsg({ kind: "ok", text: "Saved." });
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm(`Delete “${product.name}” permanently? This cannot be undone.`)) return;
    setBusy("delete");
    setMsg(null);
    try {
      await deleteProduct(product.id);
      onRemove(product.id);
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Delete failed" });
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-gz-border bg-gz-surface p-4">
      <div className="flex gap-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-gz-border bg-gz-bg-alt">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill sizes="112px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-gz-muted">No photo</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Name</label>
              <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={PRODUCT_LIMITS.name} />
            </div>
            <div>
              <label className={labelClass}>Team</label>
              <input className={fieldClass} value={team} onChange={(e) => setTeam(e.target.value)} maxLength={PRODUCT_LIMITS.team} />
            </div>
            <div>
              <label className={labelClass}>Price ($)</label>
              <input
                className={fieldClass}
                type="number"
                min="0"
                step="0.01"
                max={PRODUCT_LIMITS.price}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Sizes (comma separated)</label>
          <input className={fieldClass} value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="S, M, L, XL" />
        </div>
        <div>
          <label className={labelClass}>Replace photo</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={onPickImage}
            disabled={busy === "upload"}
            className="mt-1 block w-full cursor-pointer text-sm text-gz-body file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gz-navy file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:text-white"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className={labelClass}>Description</label>
        <textarea
          className={`${fieldClass} min-h-16`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={PRODUCT_LIMITS.description}
        />
      </div>

      {sections.length > 0 && (
        <div className="mt-4 border-t border-gz-border pt-4">
          <SectionPicker
            sections={sections}
            selected={productSections}
            onChange={setProductSections}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gz-navy">
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 w-4 cursor-pointer" />
          In stock
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gz-navy">
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} className="h-4 w-4 cursor-pointer" />
          Hidden from shop
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-gz-navy">
          <input type="checkbox" checked={isMystery} onChange={(e) => setIsMystery(e.target.checked)} className="h-4 w-4 cursor-pointer" />
          Mystery kit
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={remove}
            disabled={busy !== null}
            className="cursor-pointer rounded-full border border-gz-red px-4 py-2 text-sm font-bold text-gz-red transition-colors duration-200 hover:bg-gz-red hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "delete" ? "Deleting…" : "Delete"}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy !== null}
            className="cursor-pointer rounded-full bg-gz-navy px-5 py-2 text-sm font-extrabold uppercase tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "save" ? "Saving…" : busy === "upload" ? "Uploading…" : "Save"}
          </button>
        </div>
      </div>

      {msg && (
        <p className={`mt-2 text-sm font-bold ${msg.kind === "ok" ? "text-gz-green" : "text-gz-red"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
