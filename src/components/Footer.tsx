import Image from "next/image";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { buildWhatsappLink } from "@/lib/whatsapp";

const waLink = buildWhatsappLink(WHATSAPP_NUMBER, "Hi GoalZone! I'd like to order a kit.");

export function Footer() {
  return (
    <footer className="border-t border-gz-border bg-gz-bg-alt">
      <div className="gz-flagbar h-1 w-full" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Image src="/logo.jpeg" alt="GoalZone" width={200} height={107} className="h-10 w-auto" />
            <p className="mt-3 text-sm leading-relaxed text-gz-body">
              Replica national-team kits in Beirut, themed for the FIFA World Cup 2026.
              Cash on delivery across Lebanon.
            </p>
          </div>

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
          © {new Date().getFullYear()} The Goal Zone. Replica kits — not affiliated with FIFA or any national federation.
        </p>
      </div>
    </footer>
  );
}
