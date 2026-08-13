import type { Metadata } from "next";
import { InfoLink, InfoPage, InfoSection } from "@/components/InfoPage";
import { DELIVERY_LONG, EXCHANGE_LONG, LEAD_TIME_LONG } from "@/lib/shop-info";

const DESCRIPTION =
  "How ordering from The Goal Zone works: replicas, prices, delivery times and exchanges.";

export const metadata: Metadata = {
  title: "Terms",
  description: DESCRIPTION,
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms | The Goal Zone",
    description: DESCRIPTION,
    type: "website",
    url: "/terms",
    images: ["/logo.jpeg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms | The Goal Zone",
    description: DESCRIPTION,
    images: ["/logo.jpeg"],
  },
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms"
      intro="Plain language, because these are the terms we actually work to rather than ones copied from somewhere else."
    >
      <InfoSection heading="These are replicas">
        <p>
          Every kit on this site is a replica. It is not licensed by, produced by, or affiliated
          with any club, league, federation or brand, and the club names and crests shown are
          there to describe which shirt you are looking at — they remain the property of their
          owners.
        </p>
      </InfoSection>

      <InfoSection heading="Ordering">
        <p>
          Adding kits to the cart does not order anything. An order exists once you have sent the
          WhatsApp message and we have confirmed it in the chat — that confirmation is where the
          price, sizing and delivery are agreed.
        </p>
        <p>
          We may not be able to fill an order: stock moves, and a supplier batch can come back
          short. If that happens we tell you before anything ships and nothing is owed.
        </p>
      </InfoSection>

      <InfoSection heading="Prices">
        <p>
          Prices are in US dollars and are what you pay for the shirt. Delivery is charged
          separately and stated below. Prices can change, but never on an order we have already
          confirmed with you.
        </p>
      </InfoSection>

      <InfoSection heading="Delivery">
        <p>{LEAD_TIME_LONG}</p>
        <p>{DELIVERY_LONG}</p>
        <p>
          The two-week estimate is an estimate. Batches occasionally run late for reasons outside
          our control; if yours does, we tell you rather than waiting for you to ask.
        </p>
      </InfoSection>

      <InfoSection heading="Exchanges">
        <p>{EXCHANGE_LONG}</p>
        <p>
          If a shirt arrives faulty or is not the one you ordered, that is on us — tell us and we
          will replace it or refund it, whichever you prefer.
        </p>
      </InfoSection>

      <InfoSection heading="Mystery boxes">
        <p>
          A mystery box is sold on the understanding that you do not choose the kit. It will be
          in your size and it will not be a goalkeeper shirt; beyond that the pick is ours. A
          mystery box can be exchanged for a different size, but not for a different kit.
        </p>
      </InfoSection>

      <InfoSection heading="This page">
        <p>
          These are customer-facing terms describing how we operate, written for clarity rather
          than as legal cover. Questions about any of it:{" "}
          <InfoLink href="/contact">contact us</InfoLink>. Last updated August 2026.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
