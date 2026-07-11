import type { Metadata } from "next";
import { Anton, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/config";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const hanken = Hanken_Grotesk({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  title: { default: "The Goal Zone — Football Kits", template: "%s | The Goal Zone" },
  description: "Replica national-team jerseys in Beirut. Browse, pick your size, order on WhatsApp.",
  openGraph: {
    title: "The Goal Zone — Football Kits",
    description: "Replica national-team jerseys in Beirut. Order on WhatsApp.",
    type: "website",
    images: ["/logo.jpeg"],
  },
  verification: {
    google: "4DjHPNCVOoZJW8GClLr40jXPUyCM-zje_Xu9y7t957A",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${anton.variable} ${hanken.variable} bg-gz-bg font-[family-name:var(--font-body)] text-gz-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
