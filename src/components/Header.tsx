"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { buildWhatsappLink } from "@/lib/whatsapp";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "World Cup Kits", href: "/#catalog" },
  { label: "Shop by Country", href: "/#countries" },
  { label: "Mystery Kits", href: "/#mystery" },
  { label: "New Arrivals", href: "/#arrivals" },
];

const waLink = buildWhatsappLink(
  WHATSAPP_NUMBER,
  "Hi GoalZone! I have a question about your kits.",
);

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.36.101 11.945c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.581 0 11.94-5.36 11.943-11.945a11.821 11.821 0 00-3.495-8.404" />
    </svg>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-gz-bg/95 backdrop-blur">
      {/* World Cup tri-color motif */}
      <div className="gz-flagbar h-1 w-full" aria-hidden="true" />

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" aria-label="The Goal Zone home" className="flex items-center">
          <Image src="/logo.jpeg" alt="GoalZone" width={200} height={107} priority className="h-9 w-auto sm:h-11" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-bold uppercase tracking-wide text-gz-navy transition-colors duration-200 hover:bg-gz-bg-alt hover:text-gz-red"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden cursor-pointer items-center gap-2 rounded-full bg-gz-whatsapp px-4 py-2 text-sm font-extrabold text-black transition-opacity duration-200 hover:opacity-90 sm:flex"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Order
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gz-border text-gz-navy transition-colors duration-200 hover:bg-gz-bg-alt md:hidden"
          >
            {open ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="border-t border-gz-border bg-gz-bg px-4 py-2 md:hidden" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block cursor-pointer rounded-lg px-3 py-3 text-base font-bold uppercase tracking-wide text-gz-navy transition-colors duration-200 hover:bg-gz-bg-alt hover:text-gz-red"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gz-whatsapp px-4 py-3 text-base font-extrabold text-black"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Order on WhatsApp
          </a>
        </nav>
      )}
    </header>
  );
}
