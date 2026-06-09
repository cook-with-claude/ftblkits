import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { SizePicker } from "@/components/SizePicker";
import { getAllJerseySlugs, getJerseyBySlug, getSiteSettings } from "@/lib/sanity/queries";

export const revalidate = 60;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateStaticParams() {
  const slugs = await getAllJerseySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const jersey = await getJerseyBySlug(slug);
  if (!jersey) return { title: "Jersey not found" };
  const title = `${jersey.team} ${jersey.kitType} — $${jersey.price}`;
  return {
    title,
    openGraph: { title, images: jersey.photos[0] ? [jersey.photos[0].url] : ["/logo.jpeg"] },
  };
}

export default async function JerseyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [jersey, settings] = await Promise.all([getJerseyBySlug(slug), getSiteSettings()]);
  if (!jersey) notFound();

  const pageUrl = `${siteUrl}/jersey/${jersey.slug}`;

  return (
    <main className="pb-28">
      <Header />
      <div className="px-4">
        <div className="relative mt-4 aspect-square overflow-hidden rounded-2xl bg-gz-surface">
          {jersey.photos[0] && (
            <Image
              src={jersey.photos[0].url}
              alt={jersey.photos[0].alt}
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
              priority
            />
          )}
        </div>

        {jersey.photos.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {jersey.photos.slice(1).map((p, i) => (
              <div key={i} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gz-surface">
                <Image src={p.url} alt={p.alt} fill sizes="80px" className="object-cover" />
              </div>
            ))}
          </div>
        )}

        <h1 className="mt-5 font-[family-name:var(--font-display)] text-3xl uppercase leading-none">
          {jersey.team}
        </h1>
        <p className="mt-1 font-extrabold uppercase tracking-wide text-gz-red">{jersey.kitType}</p>
        <p className="mt-2 text-2xl font-bold">${jersey.price}</p>

        <SizePicker jersey={jersey} settings={settings} pageUrl={pageUrl} />
      </div>
    </main>
  );
}
