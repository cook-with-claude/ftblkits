import type { Metadata } from "next";
import { InfoLink, InfoPage, InfoSection } from "@/components/InfoPage";
import { LEAD_TIME_LONG } from "@/lib/shop-info";

const DESCRIPTION =
  "Who runs The Goal Zone, where the kits come from, and why they take about two weeks to arrive.";

export const metadata: Metadata = {
  title: "About",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | The Goal Zone",
    description: DESCRIPTION,
    type: "website",
    url: "/about",
    images: ["/logo.jpeg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "About | The Goal Zone",
    description: DESCRIPTION,
    images: ["/logo.jpeg"],
  },
};

export default function AboutPage() {
  return (
    <InfoPage
      title="About"
      intro="The Goal Zone is a small replica-kit shop in Beirut. We stock the current season, last season, and a back catalogue of retro shirts, and every order is handled by a person on WhatsApp."
    >
      <InfoSection heading="What we sell">
        <p>
          Replica football kits — current-season strips from the leagues we follow, national-team
          shirts, and several hundred retro classics going back to the 1980s. They are replicas,
          not official licensed merchandise, and we are not affiliated with any club, league or
          federation.
        </p>
        <p>
          What that buys you is the shirt at roughly a quarter of the licensed price. What it
          does not buy you is a club shop guarantee, and we would rather say that here than let
          you find it out later.
        </p>
      </InfoSection>

      <InfoSection heading="How it works">
        <p>{LEAD_TIME_LONG}</p>
        <p>
          There is no checkout on this site. You browse, pick sizes, and the site writes your
          order into a WhatsApp message. We confirm sizing and delivery in the chat, and you pay
          cash when the kit arrives.
        </p>
      </InfoSection>

      <InfoSection heading="Why WhatsApp and not a checkout">
        <p>
          Because sizing on replica shirts is genuinely tricky, stock moves, and a two-week wait
          deserves a conversation rather than a confirmation email. Every order that has ever
          needed a size changed, a club swapped or a delivery rearranged has been sorted in a
          couple of messages. A checkout would have made all of those into support tickets.
        </p>
      </InfoSection>

      <InfoSection heading="Find us">
        <p>
          Day to day we are most active on{" "}
          <InfoLink href="https://www.instagram.com/goalzone961/">Instagram</InfoLink> — new
          arrivals, restocks and what a kit actually looks like on someone rather than on a
          hanger. There is more on{" "}
          <InfoLink href="https://www.tiktok.com/@goalzone961">TikTok</InfoLink>, and the{" "}
          <InfoLink href="/contact">contact page</InfoLink> has every way to reach us.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
