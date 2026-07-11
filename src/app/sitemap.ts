import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";
import { getAllProducts } from "@/lib/supabase/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getAllProducts();
  const products = catalog.status === "ok" ? catalog.products.filter((product) => product.inStock) : [];

  const jerseyUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/jersey/${product.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...jerseyUrls,
  ];
}
