"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { buildWhatsappLink } from "@/lib/whatsapp";
import {
  groupSections,
  sectionHref,
  NAV_GROUP_SHORT_LABELS,
  type Section,
} from "@/lib/sections";
import { cartCount } from "@/lib/cart";
import { lockBodyScroll, useDisclosureTransition } from "@/lib/motion";
import { CART_TRIGGER_ATTR, openCart, useCart } from "./cart/useCart";

// Matches --gz-dur-base.
const DRAWER_MS = 200;

const waLink = buildWhatsappLink(
  WHATSAPP_NUMBER,
  "Hi GoalZone! I have a question about your kits.",
);

function CartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M6 6h15l-1.5 9h-12z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.36.101 11.945c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.581 0 11.94-5.36 11.943-11.945a11.821 11.821 0 00-3.495-8.404" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className} aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" strokeLinecap="round" />
    </svg>
  );
}

// whitespace-nowrap was absent repo-wide, so every one of these could break
// mid-label the moment the row ran out of room — and with nine top-level items
// it always did. Padding and tracking are tighter than the rest of the app's
// controls for the same reason: this row has to fit on one line.
const linkBase =
  "inline-flex min-h-11 cursor-pointer items-center whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-bold uppercase transition-colors gz-base ease-gz-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy";
const linkIdle = "text-gz-navy hover:bg-gz-bg-alt hover:text-gz-red";
const linkActive = "bg-gz-bg-alt text-gz-red";

export function Header({ sections = [] }: { sections?: Section[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // The panel itself is rendered by StorefrontShell, outside this header: the
  // header's backdrop-blur would otherwise clip a fixed-position overlay to its
  // own box. This button just raises the open event.
  const { lines } = useCart();
  const count = cartCount(lines);

  const groups = groupSections(sections);
  const featured = groups.find((g) => g.group === "featured")?.sections ?? [];
  const dropdowns = groups.filter((g) => g.group !== "featured");

  // Exact match, not startsWith: "All Kits" (/kits) must not light up while you
  // are on /kits/la-liga, which has its own entry.
  const isActive = (href: string) => pathname === href;
  const groupIsActive = (group: { sections: Section[] }) =>
    group.sections.some((s) => isActive(sectionHref(s.slug)));

  // Close everything on navigation, so a dropdown never survives a route change.
  // Adjusted during render rather than in an effect: React applies it before
  // painting, so the menu never flashes open on the new page.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpenGroup(null);
    setDrawerOpen(false);
    setSearchOpen(false);
  }

  // There was no way to search from anywhere but a catalog page. CatalogFilters
  // already seeds its state from `searchParams`, so /kits?q=… is a working
  // destination with no extra wiring — this is only the way in.
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/kits?q=${encodeURIComponent(q)}` : "/kits");
    setSearchOpen(false);
  };

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSearchOpen(false);
      searchButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [searchOpen]);

  // Escape closes the open dropdown and returns focus to its trigger; a pointer
  // press outside just closes it.
  useEffect(() => {
    if (!openGroup) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const trigger = navRef.current?.querySelector<HTMLButtonElement>(
        `[data-group-trigger="${openGroup}"]`,
      );
      setOpenGroup(null);
      trigger?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpenGroup(null);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openGroup]);

  // The mobile drawer is another disclosure. Escape should close it and put
  // keyboard focus back where it came from, matching the desktop dropdowns.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setDrawerOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  // The drawer used to render in normal flow inside this sticky header, so
  // opening it physically pushed the entire page down and closing it snapped
  // everything back. It is an overlay now, which is what makes the menu feel
  // like it belongs to the header rather than to the document.
  const drawer = useDisclosureTransition(drawerOpen, DRAWER_MS);

  useEffect(() => {
    if (!drawerOpen) return;
    return lockBodyScroll();
  }, [drawerOpen]);

  return (
    <header
      className="sticky top-0 bg-gz-bg/95 backdrop-blur"
      style={{ zIndex: "var(--gz-z-sticky)" }}
    >
      {/* Brand tri-color motif */}
      <div className="gz-flagbar h-1 w-full" aria-hidden="true" />

      {/* Wider than the max-w-6xl the page content uses, deliberately. At 1152px
          the bar left the nav about 880px for a row that wants well over
          1200px, so eight of the nine items wrapped even on a 1920px screen.
          The nav also waits for xl now rather than lg: below that the drawer is
          the honest answer, and it was already built. */}
      <div className="mx-auto flex max-w-[84rem] items-center justify-between gap-3 px-4 py-3">
        <Link href="/" aria-label="The Goal Zone home" className="flex min-h-11 items-center">
          <Image src="/logo.jpeg" alt="GoalZone" width={200} height={107} priority className="h-9 w-auto sm:h-11" />
        </Link>

        <nav
          ref={navRef}
          // Measured at 908px against 947px of space at 1280 — it fits, but a
          // long section label added from /admin could still outgrow that.
          // min-w-0 plus overflow-x lets the row scroll in that case instead of
          // pushing the page sideways; with the labels as they are it never
          // engages.
          className="hidden min-w-0 items-center gap-0.5 overflow-x-auto gz-no-scrollbar xl:flex"
          aria-label="Primary"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setOpenGroup(null);
            }
          }}
        >
          <Link
            href="/kits"
            aria-current={isActive("/kits") ? "page" : undefined}
            className={`${linkBase} ${isActive("/kits") ? linkActive : linkIdle}`}
          >
            All Kits
          </Link>

          {featured.map((section) => {
            const href = sectionHref(section.slug);
            return (
              <Link
                key={section.id}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`${linkBase} ${isActive(href) ? linkActive : linkIdle}`}
              >
                {section.label}
              </Link>
            );
          })}

          {dropdowns.map((group) => {
            const isOpen = openGroup === group.group;
            const panelId = `nav-panel-${group.group}`;
            return (
              <div key={group.group} className="relative">
                {/* Click, not hover: hover-only menus are unusable by keyboard
                    and hostile on touch devices. */}
                <button
                  type="button"
                  data-group-trigger={group.group}
                  onClick={() => setOpenGroup(isOpen ? null : group.group)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className={`${linkBase} flex items-center gap-1 ${
                    isOpen || groupIsActive(group) ? linkActive : linkIdle
                  }`}
                >
                  {NAV_GROUP_SHORT_LABELS[group.group]}
                  <ChevronIcon className={`h-3.5 w-3.5 transition-transform gz-base ease-gz-out ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div
                    id={panelId}
                    style={{ zIndex: "var(--gz-z-dropdown)" }}
                    className="gz-pop absolute left-0 top-full mt-1 max-h-[70vh] min-w-56 overflow-y-auto rounded-xl border border-gz-border bg-gz-surface p-2 shadow-[0_24px_44px_-16px_rgba(0,0,0,0.28)]"
                  >
                    <ul className={group.sections.length > 8 ? "sm:columns-2" : undefined}>
                      {group.sections.map((section) => {
                        const href = sectionHref(section.slug);
                        return (
                          <li key={section.id} className="break-inside-avoid">
                            <Link
                              href={href}
                              aria-current={isActive(href) ? "page" : undefined}
                              className={`flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-bold transition-colors gz-base ease-gz-out ${
                                isActive(href)
                                  ? "bg-gz-bg-alt text-gz-red"
                                  : "text-gz-navy hover:bg-gz-bg-alt hover:text-gz-red"
                              }`}
                            >
                              {section.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          {/* Search was reachable only from a catalog page, which is the one
              place you are already able to filter. */}
          <button
            ref={searchButtonRef}
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-expanded={searchOpen}
            aria-controls="header-search"
            aria-label={searchOpen ? "Close search" : "Search kits"}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gz-border text-gz-navy transition-colors gz-base ease-gz-out hover:bg-gz-bg-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy"
          >
            <SearchIcon className="h-5 w-5" />
          </button>

          {/* Always visible, unlike the WhatsApp button: on a phone this is the
              only way back to the cart. */}
          <button
            {...{ [CART_TRIGGER_ATTR]: "" }}
            type="button"
            onClick={openCart}
            aria-haspopup="dialog"
            aria-label={count > 0 ? `Open cart, ${count} ${count === 1 ? "kit" : "kits"}` : "Open cart, empty"}
            className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gz-border text-gz-navy transition-colors gz-base ease-gz-out hover:bg-gz-bg-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy"
          >
            <CartIcon className="h-5 w-5" />
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gz-red px-1 text-[11px] font-extrabold text-white"
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </button>

          {/* Was hidden below 640px. The drawer and the footer both carry one,
              but each costs an extra tap on the device most of this shop's
              traffic arrives on. Icon-only on a phone, labelled once there is
              room for the word. */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Order on WhatsApp"
            className="flex min-h-11 w-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-gz-whatsapp text-sm font-extrabold text-black transition-opacity gz-base ease-gz-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy sm:w-auto sm:px-4 sm:py-2"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Order</span>
          </a>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-expanded={drawerOpen}
            aria-controls="mobile-primary-navigation"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gz-border text-gz-navy transition-colors gz-base ease-gz-out hover:bg-gz-bg-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy xl:hidden"
          >
            {drawerOpen ? (
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

      {/* A row of its own rather than a field wedged into the bar: at 375px
          there is no width for one, and on desktop the nav already owns the
          middle. Submitting hands off to /kits, which does the actual work. */}
      {searchOpen && (
        <div className="border-t border-gz-border bg-gz-bg">
          <form
            id="header-search"
            role="search"
            onSubmit={submitSearch}
            className="mx-auto flex max-w-[84rem] items-center gap-2 px-4 py-3"
          >
            <label htmlFor="header-search-input" className="sr-only">
              Search kits
            </label>
            <input
              ref={searchInputRef}
              id="header-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search kits or teams…"
              className="min-h-11 flex-1 rounded-xl border border-gz-border bg-gz-surface px-4 py-2 text-base text-gz-text placeholder:text-gz-muted focus:border-gz-navy focus:outline-none focus:ring-2 focus:ring-gz-navy"
            />
            <button
              type="submit"
              className="min-h-11 cursor-pointer rounded-xl bg-gz-navy px-5 text-sm font-extrabold uppercase tracking-wide text-white transition-opacity gz-base ease-gz-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gz-navy"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile drawer. Groups use native <details> so they are keyboard- and
          screen-reader-accessible with no extra state to manage.
          Positioned absolutely against the sticky header so it floats over the
          page instead of displacing it. */}
      {drawer.mounted && (
        <div
          className={`absolute inset-x-0 top-full h-screen bg-gz-navy-deep/40 transition-opacity gz-base ease-gz-out xl:hidden ${
            drawer.entered ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      {drawer.mounted && (
        <nav
          id="mobile-primary-navigation"
          className={`absolute inset-x-0 top-full max-h-[80vh] overflow-y-auto border-t border-gz-border bg-gz-bg px-4 py-2 shadow-[0_24px_44px_-16px_rgba(0,0,0,0.28)] transition-[opacity,transform,translate] gz-base ease-gz-out xl:hidden ${
            drawer.entered ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
          }`}
          aria-label="Mobile"
        >
          <Link
            href="/kits"
            aria-current={isActive("/kits") ? "page" : undefined}
            className={`block rounded-lg px-3 py-3 text-base font-bold uppercase tracking-wide transition-colors gz-base ease-gz-out ${
              isActive("/kits") ? linkActive : linkIdle
            }`}
          >
            All Kits
          </Link>

          {featured.map((section) => {
            const href = sectionHref(section.slug);
            return (
              <Link
                key={section.id}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`block rounded-lg px-3 py-3 text-base font-bold uppercase tracking-wide transition-colors gz-base ease-gz-out ${
                  isActive(href) ? linkActive : linkIdle
                }`}
              >
                {section.label}
              </Link>
            );
          })}

          {dropdowns.map((group) => (
            <details key={group.group} open={groupIsActive(group)} className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 py-3 text-base font-bold uppercase tracking-wide text-gz-navy transition-colors gz-base ease-gz-out hover:bg-gz-bg-alt [&::-webkit-details-marker]:hidden">
                {group.label}
                <ChevronIcon className="h-4 w-4 transition-transform gz-base ease-gz-out group-open:rotate-180" />
              </summary>
              <div className="pb-1 pl-3">
                {group.sections.map((section) => {
                  const href = sectionHref(section.slug);
                  return (
                    <Link
                      key={section.id}
                      href={href}
                      aria-current={isActive(href) ? "page" : undefined}
                      className={`flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm font-bold transition-colors gz-base ease-gz-out ${
                        isActive(href)
                          ? "bg-gz-bg-alt text-gz-red"
                          : "text-gz-navy hover:bg-gz-bg-alt hover:text-gz-red"
                      }`}
                    >
                      {section.label}
                    </Link>
                  );
                })}
              </div>
            </details>
          ))}

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
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
