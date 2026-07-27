import Image from "next/image";
import Link from "next/link";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { sectionHref, type Section } from "@/lib/sections";

const waLink = buildWhatsappLink(WHATSAPP_NUMBER, "Hi GoalZone! I'd like to order a kit.");

export function Footer({ sections = [] }: { sections?: Section[] }) {
  // A short list only — the header already carries the full taxonomy. This is
  // here for internal linking and as a fallback if the nav is missed.
  const shortcuts = [...sections].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 6);

  return (
    <footer className="border-t border-gz-border bg-gz-bg-alt">
      <div className="gz-flagbar h-1 w-full" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
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
                className="cursor-pointer font-bold text-gz-navy transition-colors duration-200 hover:text-gz-red"
              >
                All Kits
              </Link>
              {shortcuts.map((section) => (
                <Link
                  key={section.id}
                  href={sectionHref(section.slug)}
                  className="cursor-pointer font-bold text-gz-navy transition-colors duration-200 hover:text-gz-red"
                >
                  {section.label}
                </Link>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 text-sm">
            <span className="text-xs font-extrabold uppercase tracking-widest text-gz-muted">Order &amp; Contact</span>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer font-bold text-gz-navy transition-colors duration-200 hover:text-gz-green"
            >
              Order on WhatsApp
            </a>
            <a
              href="https://www.instagram.com/goalzone961/"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer font-bold text-gz-navy transition-colors duration-200 hover:text-gz-red"
            >
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@goalzone961"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer font-bold text-gz-navy transition-colors duration-200 hover:text-gz-red"
            >
              TikTok
            </a>
          </div>
        </div>

        <p className="mt-10 text-xs text-gz-muted">
          © {new Date().getFullYear()} The Goal Zone. Replica kits — not affiliated with any club, league or federation.
        </p>
      </div>
    </footer>
  );
}
