import Image from "next/image";
import Link from "next/link";
import { SocialLinks } from "@/components/SocialLinks";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { sectionHref, type Section } from "@/lib/sections";
import { DELIVERY_SHORT, LEAD_TIME_SHORT, PHONE_DISPLAY } from "@/lib/shop-info";

const waLink = buildWhatsappLink(WHATSAPP_NUMBER, "Hi GoalZone! I'd like to order a kit.");

// Ordered by what a hesitant buyer actually needs: the FAQ carries delivery,
// returns and sizing, which is worth more than any of the others.
const INFO_LINKS = [
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer({ sections = [] }: { sections?: Section[] }) {
  // A short list only — the header already carries the full taxonomy. This is
  // here for internal linking and as a fallback if the nav is missed.
  const shortcuts = [...sections].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 6);

  return (
    <footer className="border-t border-gz-border bg-gz-bg-alt">
      <div className="gz-flagbar h-1 w-full" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* A grid rather than a flex row: with Shop, Help and Contact columns
            alongside the blurb, justify-between crushed them at the sm
            breakpoint. */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-sm">
            <Image src="/logo.jpeg" alt="GoalZone" width={200} height={107} className="h-10 w-auto" />
            <p className="mt-3 text-sm leading-relaxed text-gz-body">
              Replica football kits in Beirut — leagues, clubs, national teams and retro.
              Cash on delivery across Lebanon.
            </p>
          </div>

          {shortcuts.length > 0 && (
            <div className="flex flex-col gap-3 text-sm">
              <span className="text-xs font-extrabold uppercase tracking-widest text-gz-muted">Shop</span>
              <Link
                href="/kits"
                className="cursor-pointer font-bold text-gz-navy transition-colors gz-base ease-gz-out hover:text-gz-red"
              >
                All Kits
              </Link>
              {shortcuts.map((section) => (
                <Link
                  key={section.id}
                  href={sectionHref(section.slug)}
                  className="cursor-pointer font-bold text-gz-navy transition-colors gz-base ease-gz-out hover:text-gz-red"
                >
                  {section.label}
                </Link>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 text-sm">
            <span className="text-xs font-extrabold uppercase tracking-widest text-gz-muted">Help</span>
            {INFO_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="cursor-pointer font-bold text-gz-navy transition-colors gz-base ease-gz-out hover:text-gz-red"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <span className="text-xs font-extrabold uppercase tracking-widest text-gz-muted">Order &amp; Contact</span>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer font-bold text-gz-navy transition-colors gz-base ease-gz-out hover:text-gz-green"
            >
              Order on WhatsApp
            </a>
            {/* The number lived only inside wa.me URLs, so a customer who wanted
                to call — or just to check a real one existed — had nothing to
                read. */}
            <a
              href={`tel:+${WHATSAPP_NUMBER}`}
              className="cursor-pointer font-bold text-gz-navy transition-colors gz-base ease-gz-out hover:text-gz-green"
            >
              {PHONE_DISPLAY}
            </a>
            <span className="text-gz-body">{LEAD_TIME_SHORT} · {DELIVERY_SHORT}</span>
          </div>
        </div>

        {/* Instagram is where this shop actually lives — new arrivals, restocks,
            kits on real people. It was a 40px monochrome glyph in the fine
            print, which is not how you use your strongest proof. */}
        <a
          href="https://www.instagram.com/goalzone961/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-gz-border bg-gz-surface px-4 py-4 transition-colors gz-base ease-gz-out hover:border-gz-navy/40 hover:bg-gz-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy"
        >
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg uppercase text-gz-navy">
              See the kits on real people
            </p>
            <p className="mt-1 text-sm text-gz-body">
              @goalzone961 — new arrivals, restocks and what each shirt actually looks like.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-gz-navy px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white">
            Instagram
          </span>
        </a>

        {/* col-reverse on mobile lifts the icons (last in the DOM) above the
            fine print; sm: puts them back on the right of the same row. */}
        <div className="mt-10 flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gz-muted">
            © {new Date().getFullYear()} The Goal Zone. Replica kits — not affiliated with any club, league or federation.
          </p>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
