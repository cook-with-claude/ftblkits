import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { SizePicker } from "@/components/SizePicker";
import { MysteryVisual } from "@/components/MysteryVisual";
import { getProductById } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Jersey not found" };
  const title = `${product.name} — $${product.price}`;
  return {
    title,
    openGraph: { title, images: product.imageUrl ? [product.imageUrl] : ["/logo.jpeg"] },
  };
}

export default async function JerseyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <main className="pb-28">
      <Header />
      <div className="mx-auto max-w-6xl px-4">
        <Link
          href="/#catalog"
          className="mt-5 inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-gz-navy transition-colors duration-200 hover:text-gz-red"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to catalog
        </Link>

        <div className="mt-4 grid gap-8 md:grid-cols-2 md:items-start">
          <div
            className={`relative aspect-square overflow-hidden rounded-3xl border ${
              product.isMystery ? "border-gz-magenta/30" : "border-gz-border bg-gz-bg-alt"
            }`}
          >
            {product.isMystery ? (
              <MysteryVisual size="detail" />
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
              {product.isMystery ? "Mystery Kit" : product.country}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl uppercase leading-none text-gz-navy sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-3 text-2xl font-bold text-gz-text">
              ${product.price}
              {product.isMystery && (
                <span className="ml-2 text-sm font-bold text-gz-muted">· kits worth up to $25</span>
              )}
            </p>

            {product.description && (
              <p className="mt-4 text-sm leading-relaxed text-gz-body">{product.description}</p>
            )}

            {product.isMystery && (
              <ol className="mt-5 space-y-2.5">
                {[
                  "Pick your size below.",
                  "Order on WhatsApp — pay cash on delivery.",
                  "We hand-pick an in-stock kit and surprise you.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gz-body">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gz-magenta text-xs font-extrabold text-white">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            )}

            <SizePicker product={product} />

            <div className="mt-6 h-1 w-16 rounded-full gz-flag-gradient" aria-hidden="true" />
            <p className="mt-4 text-xs leading-relaxed text-gz-muted">
              Cash on delivery across Lebanon · Order &amp; confirm sizing on WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
