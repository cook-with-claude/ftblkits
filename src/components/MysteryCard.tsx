import Link from "next/link";
import type { Product } from "@/lib/types";
import { isSoldOut } from "@/lib/catalog";
import { mysteryKitDescription } from "@/lib/mystery";

// Scattered twinkling sparkles over the mystery card header.
const SPARKLES = [
  { top: "26%", left: "18%", size: "12px", color: "#EC1E5C", delay: "0s" },
  { top: "20%", right: "22%", size: "9px", color: "#fff", delay: "0.5s" },
  { bottom: "24%", right: "26%", size: "13px", color: "#EC1E5C", delay: "0.9s" },
];

// A mystery "tier" card. Lives inside the dark Mystery Kits panel: a glassy translucent
// body with a gradient header holding a floating "?" and sparkles, distinct from the
// white JerseyCard used in the main kit grid.
export function MysteryCard({ product }: { product: Product }) {
  const soldOut = isSoldOut(product);
  const tagline = mysteryKitDescription();

  return (
    <Link
      href={`/jersey/${product.id}`}
      className="group relative block cursor-pointer overflow-hidden rounded-[20px] border border-white/15 bg-white/[0.05] transition-all duration-300 hover:-translate-y-1.5 hover:border-gz-magenta hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-magenta"
    >
      <div
        className="relative h-40 overflow-hidden"
        style={{ background: "radial-gradient(130% 130% at 30% 12%, #3a1450, #15206b 72%)" }}
      >
        {SPARKLES.map((s, i) => (
          <span
            key={i}
            className="gz-twinkle absolute font-[family-name:var(--font-display)]"
            style={{
              top: s.top,
              left: s.left,
              right: s.right,
              bottom: s.bottom,
              fontSize: s.size,
              color: s.color,
              animationDelay: s.delay,
            }}
            aria-hidden="true"
          >
            ✦
          </span>
        ))}
        <span className="gz-float absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-[family-name:var(--font-display)] text-[86px] leading-none text-white/90">
          ?
        </span>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-gz-navy-deep/70">
            <span className="-rotate-6 rounded border-2 border-white px-3 py-1 font-[family-name:var(--font-display)] text-lg uppercase text-white">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-3 p-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-gz-magenta">
            Mystery Kit
          </p>
          <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-lg uppercase leading-none text-white">
            {product.name}
          </h3>
          <p className="mt-1.5 text-xs leading-snug text-white/60">{tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-[family-name:var(--font-display)] text-[27px] leading-none text-white">
            ${product.price}
          </p>
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-gz-magenta transition-transform duration-200 group-hover:translate-x-0.5">
            Open →
          </span>
        </div>
      </div>
    </Link>
  );
}
