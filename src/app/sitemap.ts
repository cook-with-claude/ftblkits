import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { getAllProducts, getSections } from "@/lib/supabase/queries";

// Metadata route handlers are cached by default. The URLs are admin-managed, so
// regenerate this route on request just like the storefront pages.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalog, sectionsResult] = await Promise.all([getAllProducts(), getSections()]);

  const products =
    catalog.status === "ok" ? catalog.products.filter((product) => product.inStock) : [];

  // Sections appear in the nav as soon as they are visible, so the shop's shape
  // is browsable while it is still being stocked. Submitting the empty ones to
  // search engines is a different matter -- a page with no kits is thin content,
  // so a section only enters the sitemap once it actually has something in it.
  // It still gets crawled via the nav; this just stops us asking for indexing.
  const stockedSlugs = new Set(
    (catalog.status === "ok" ? catalog.products : []).flatMap((product) => product.sections),
  );

  const sectionUrls: MetadataRoute.Sitemap = sectionsResult.sections
    .filter((section) => stockedSlugs.has(section.slug))
    .map((section) => ({
      url: `${SITE_URL}/kits/${section.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

  const jerseyUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/jersey/${product.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // The information pages are static and rarely change, but /faq is the answer
  // to "how long does delivery take" — a query people genuinely search for
  // before they buy from a shop they do not know.
  const infoUrls: MetadataRoute.Sitemap = ["/faq", "/about", "/contact", "/privacy", "/terms"].map(
    (path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: path === "/faq" ? 0.6 : 0.3,
    }),
  );

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/kits`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...sectionUrls,
    ...jerseyUrls,
    ...infoUrls,
  ];
}
