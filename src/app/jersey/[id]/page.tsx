import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { SizePicker } from "@/components/SizePicker";
import { getProductById } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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

  const pageUrl = `${siteUrl}/jersey/${product.id}`;

  return (
    <main className="pb-28">
      <Header />
      <div className="px-4">
        <div className="relative mt-4 aspect-square overflow-hidden rounded-2xl bg-gz-surface">
          {product.imageUrl && (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
              priority
            />
          )}
          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55">
              <span className="-rotate-6 border-2 border-gz-red px-4 py-2 font-[family-name:var(--font-display)] text-2xl uppercase text-gz-red">
                Sold Out
              </span>
            </div>
          )}
        </div>

        <h1 className="mt-5 font-[family-name:var(--font-display)] text-3xl uppercase leading-none">
          {product.name}
        </h1>
        <p className="mt-1 font-extrabold uppercase tracking-wide text-gz-red">{product.country}</p>
        <p className="mt-2 text-2xl font-bold">${product.price}</p>

        {product.description && (
          <p className="mt-3 text-sm leading-relaxed text-white/70">{product.description}</p>
        )}

        <SizePicker product={product} pageUrl={pageUrl} />
      </div>
    </main>
  );
}
