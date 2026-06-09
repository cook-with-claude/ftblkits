import Image from "next/image";
import Link from "next/link";
import type { Jersey } from "@/lib/types";
import { isSoldOut } from "@/lib/catalog";

export function JerseyCard({ jersey }: { jersey: Jersey }) {
  const soldOut = isSoldOut(jersey);
  const photo = jersey.photos[0];

  return (
    <Link
      href={`/jersey/${jersey.slug}`}
      className="group relative block overflow-hidden rounded-2xl bg-gz-surface transition-transform duration-200 active:scale-[0.98]"
    >
      <div className="relative aspect-square">
        {photo && (
          <Image
            src={photo.url}
            alt={photo.alt}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
          />
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="-rotate-6 border-2 border-gz-red px-2 py-1 font-[family-name:var(--font-display)] text-sm uppercase text-gz-red">
              Sold Out
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-[family-name:var(--font-display)] text-base uppercase leading-tight">{jersey.team}</h3>
        <p className="text-xs font-extrabold uppercase tracking-wide text-gz-red">{jersey.kitType}</p>
        <p className="mt-1 text-sm font-bold">${jersey.price}</p>
        <ul className="mt-2 flex gap-1" aria-label="Size availability">
          {jersey.sizes.map((s) => (
            <li
              key={s.size}
              className={`flex h-5 w-6 items-center justify-center rounded text-[10px] font-bold ${
                s.inStock ? "bg-white/10 text-white" : "bg-white/5 text-white/40 line-through"
              }`}
            >
              {s.size}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
