import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "The Goal Zone — Football Kits", template: "%s | The Goal Zone" },
  description: "Replica national-team jerseys in Beirut. Browse, pick your size, order on WhatsApp.",
  openGraph: {
    title: "The Goal Zone — Football Kits",
    description: "Replica national-team jerseys in Beirut. Order on WhatsApp.",
    type: "website",
    images: ["/logo.jpeg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${anton.variable} ${inter.variable} font-[family-name:var(--font-body)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
