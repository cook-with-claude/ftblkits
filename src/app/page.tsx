import { Header } from "@/components/Header";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { getAllJerseys } from "@/lib/sanity/queries";

export const revalidate = 60; // fallback; webhook revalidation makes it near-instant

export default async function HomePage() {
  const jerseys = await getAllJerseys();
  return (
    <main>
      <Header />
      <CatalogBrowser jerseys={jerseys} />
    </main>
  );
}
