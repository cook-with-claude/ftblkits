import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SizePicker } from "@/components/SizePicker";
import { MysteryVisual } from "@/components/MysteryVisual";
import { getProductById } from "@/lib/supabase/queries";
import {
  getMysteryProductMeta,
  mysteryKitDescription,
  mysteryPoolLine,
  mysterySaving,
  MYSTERY_EXCLUSION,
  MYSTERY_GUARANTEE,
} from "@/lib/mystery";
import {
  DELIVERY_SHORT,
  EXCHANGE_SHORT,
  LEAD_TIME_SHORT,
  PHONE_DISPLAY,
} from "@/lib/shop-info";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getProductById(id);
  if (result.status === "not_found") return { title: "Jersey not found" };
  if (result.status === "unavailable") return { title: "Catalog temporarily unavailable" };
  const product = result.product;
  const title = `${product.name} — $${product.price}`;
  const url = `/jersey/${product.id}`;
  const images = product.imageUrl ? [product.imageUrl] : ["/logo.jpeg"];
  // A kit with no description of its own still needs a sentence: this is what
  // an unfurled WhatsApp share shows underneath the photo.
  const description =
    product.description ??
    `${product.name} — replica ${product.team} kit, $${product.price}. Cash on delivery across Lebanon, ordered on WhatsApp.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    // Next *replaces* openGraph rather than deep-merging it, so anything the
    // root sets — description, type, url — is lost the moment a route declares
    // its own. Each field has to be restated here or product shares unfurl with
    // a bare title and image and nothing else.
    openGraph: { title, description, type: "website", url, images },
    // There were none of these anywhere in the repo. WhatsApp reads the
    // OpenGraph tags, but every other share target that matters here — X,
    // Telegram previews, Slack — prefers the Twitter card when one exists.
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function JerseyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProductById(id);
  if (result.status === "not_found") notFound();
  if (result.status === "unavailable") {
    throw new Error("The live catalog is temporarily unavailable");
  }
  const product = result.product;
  const mysteryMeta = product.isMystery ? getMysteryProductMeta(product) : null;

  return (
    // The order bar is a mobile-only overlay now, and only appears once the
    // inline CTA has scrolled away, so above md there is nothing to clear.
    <div className="pb-28 md:pb-12">
      <div className="mx-auto max-w-6xl px-4">
        <Link
          href={product.isMystery ? "/kits/mystery-boxes" : "/kits"}
          className="mt-5 inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-gz-navy transition-colors gz-base ease-gz-out hover:text-gz-red"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {product.isMystery ? "Mystery boxes" : "All kits"}
        </Link>

        <div className="mt-4 grid gap-8 md:grid-cols-2 md:items-start">
          <div
            className={`relative aspect-square overflow-hidden rounded-3xl border ${
              product.isMystery ? "border-gz-magenta/30" : "border-gz-border bg-gz-bg-alt"
            }`}
          >
            {product.isMystery ? (
              <MysteryVisual product={product} size="detail" />
            ) : (
              product.imageUrl && (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover"
                  priority
                />
              )
            )}
            {!product.inStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-gz-navy-deep/60">
                <span className="-rotate-6 rounded border-2 border-white px-4 py-2 font-[family-name:var(--font-display)] text-2xl uppercase text-white">
                  Sold Out
                </span>
              </div>
            )}
          </div>

          <div>
            <p
              className={`font-extrabold uppercase tracking-wide ${
                product.isMystery ? "text-gz-magenta" : "text-gz-red"
              }`}
            >
              {mysteryMeta?.eyebrow ?? product.team}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl uppercase leading-none text-gz-navy sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-3 text-2xl font-bold text-gz-text">
              ${product.price}
              {product.isMystery && (
                <span className="ml-2 text-sm font-bold text-gz-muted">· priced below regular kits</span>
              )}
            </p>

            {(product.isMystery || product.description) && (
              <p className="mt-4 text-sm leading-relaxed text-gz-body">
                {product.isMystery ? mysteryKitDescription(product) : product.description}
              </p>
            )}

            {product.isMystery && mysteryMeta && (
              <>
                {/* The saving was the whole commercial argument for this tier
                    and appeared nowhere: a shopper had no way to tell whether
                    $26.99 was a deal or a markup on an unknown shirt. */}
                <p className="mt-4 rounded-xl border border-gz-magenta/30 bg-gz-bg-alt px-3 py-2.5 text-sm font-bold text-gz-navy">
                  ${mysterySaving(mysteryMeta.theme).amount.toFixed(2)} less than the same shirt
                  bought outright (${mysterySaving(mysteryMeta.theme).comparedTo}) —{" "}
                  {mysterySaving(mysteryMeta.theme).percent}% off for letting us choose.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {["Replica kit", "Your size", "Surprise pick"].map((item) => (
                    <span
                      key={item}
                      className="rounded-xl border border-gz-border bg-gz-bg-alt px-2 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-wide text-gz-navy sm:text-xs"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {/* What the pool is, what is promised, what is ruled out. */}
                <dl className="mt-5 space-y-3 text-sm leading-relaxed">
                  {[
                    { term: "What you could get", detail: mysteryPoolLine(mysteryMeta.theme) },
                    { term: "What we guarantee", detail: MYSTERY_GUARANTEE },
                    { term: "What it is never", detail: MYSTERY_EXCLUSION },
                  ].map((row) => (
                    <div key={row.term}>
                      <dt className="text-xs font-extrabold uppercase tracking-widest text-gz-muted">
                        {row.term}
                      </dt>
                      <dd className="mt-0.5 text-gz-body">{row.detail}</dd>
                    </div>
                  ))}
                </dl>

                <ol className="mt-5 space-y-2.5">
                  {[
                    "Choose your size below.",
                    "Add an optional team or style preference.",
                    "We hand-pick a matching in-stock kit and keep it secret.",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gz-body">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gz-magenta text-xs font-extrabold text-white">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </>
            )}

            <SizePicker product={product} />

            <div className="mt-6 h-1 w-16 rounded-full gz-flag-gradient" aria-hidden="true" />

            {/* The three things a first-time buyer asks before they will press
                send, answered before they have to ask. The delivery window
                leads: two weeks is a long time to find out about afterwards,
                and saying it plainly costs less trust than discovering it in
                the chat does. */}
            <dl className="mt-4 space-y-2.5 text-sm">
              {[
                { term: "Delivery", detail: `${LEAD_TIME_SHORT} — we order from our supplier in batches` },
                { term: "Cost", detail: DELIVERY_SHORT + ", paid cash on delivery" },
                { term: "If it doesn't fit", detail: EXCHANGE_SHORT + ", unworn with tags" },
              ].map((row) => (
                <div key={row.term} className="flex gap-2.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 h-4 w-4 shrink-0 text-gz-green" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <dt className="inline font-bold text-gz-navy">{row.term}: </dt>
                    <dd className="inline text-gz-body">{row.detail}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <p className="mt-4 text-xs leading-relaxed text-gz-muted">
              Questions about fit or timing?{" "}
              <Link href="/faq" className="cursor-pointer font-bold text-gz-navy underline hover:text-gz-red">
                Read the FAQ
              </Link>{" "}
              or message us on {PHONE_DISPLAY}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
