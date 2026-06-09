import Link from "next/link";
import { Header } from "@/components/Header";

export default function JerseyNotFound() {
  return (
    <main>
      <Header />
      <div className="px-4 py-20 text-center">
        <p className="text-white/70">This jersey isn&apos;t available.</p>
        <Link href="/" className="mt-4 inline-block font-bold text-gz-red">
          Back to catalog
        </Link>
      </div>
    </main>
  );
}
