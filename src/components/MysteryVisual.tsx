// The "?" hero graphic for mystery kits — a navy→magenta gradient with a big floating
// question mark, soft accent glows, and twinkling sparkles. Fills its parent like an
// <Image fill>, so it drops straight into the same aspect-square containers as a photo.

const SPARKLES = [
  { top: "16%", left: "14%", size: 6, delay: "0s" },
  { top: "28%", left: "82%", size: 4, delay: "0.6s" },
  { top: "70%", left: "20%", size: 5, delay: "1.2s" },
  { top: "78%", left: "76%", size: 7, delay: "0.3s" },
  { top: "44%", left: "90%", size: 3, delay: "1.6s" },
  { top: "58%", left: "8%", size: 4, delay: "0.9s" },
];

export function MysteryVisual({ size = "card" }: { size?: "card" | "detail" }) {
  const markClass =
    size === "detail" ? "text-[9rem] sm:text-[13rem]" : "text-7xl sm:text-8xl";

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-gradient-to-br from-gz-navy-deep via-gz-navy to-[#3a1450]"
      aria-hidden="true"
    >
      {/* Soft accent glows */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gz-magenta/45 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-gz-red/30 blur-3xl" />

      {/* Twinkling sparkles */}
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="gz-twinkle absolute rounded-full bg-white"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
          }}
        />
      ))}

      {/* The mark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`gz-float font-[family-name:var(--font-display)] ${markClass} leading-none text-white drop-shadow-[0_6px_24px_rgba(236,30,92,0.55)]`}
        >
          ?
        </span>
      </div>

      {/* Tri-color motif, consistent with the rest of the site */}
      <div className="gz-flagbar absolute inset-x-0 bottom-0 h-1.5" />
    </div>
  );
}
