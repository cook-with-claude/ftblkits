import type { Metadata } from "next";
import { InfoLink, InfoPage, InfoSection } from "@/components/InfoPage";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { LEAD_TIME_SHORT, PHONE_DISPLAY } from "@/lib/shop-info";

const DESCRIPTION =
  "Reach The Goal Zone on WhatsApp, Instagram or TikTok. Replica football kits in Beirut.";

export const metadata: Metadata = {
  title: "Contact",
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact | The Goal Zone",
    description: DESCRIPTION,
    type: "website",
    url: "/contact",
    images: ["/logo.jpeg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact | The Goal Zone",
    description: DESCRIPTION,
    images: ["/logo.jpeg"],
  },
};

const waLink = buildWhatsappLink(WHATSAPP_NUMBER, "Hi GoalZone!");

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact"
      intro="One person reads all of these. WhatsApp gets the fastest answer."
    >
      <InfoSection heading="WhatsApp">
        <p>
          <InfoLink href={waLink}>Open a chat</InfoLink>, or save the number:{" "}
          {/* Published as readable text, not only inside a wa.me URL. Someone
              who wants to call, or to add us to their contacts, previously had
              nothing to copy. */}
          <InfoLink href={`tel:+${WHATSAPP_NUMBER}`}>{PHONE_DISPLAY}</InfoLink>.
        </p>
        <p>
          This is where orders, sizing questions and delivery arrangements happen. It is also the
          fastest way to ask whether we can get a kit that is not listed.
        </p>
      </InfoSection>

      <InfoSection heading="Instagram and TikTok">
        <p>
          <InfoLink href="https://www.instagram.com/goalzone961/">@goalzone961</InfoLink> on
          Instagram is where new arrivals and restocks go up first, and where you can see kits on
          actual people rather than on a hanger. We are also on{" "}
          <InfoLink href="https://www.tiktok.com/@goalzone961">TikTok</InfoLink>.
        </p>
      </InfoSection>

      <InfoSection heading="Where we deliver">
        <p>
          Anywhere in Lebanon. Beirut is free, everywhere else is a flat $3, and you pay cash when
          the kit reaches you. Allow {LEAD_TIME_SHORT.toLowerCase()} — the{" "}
          <InfoLink href="/faq">FAQ</InfoLink> explains why.
        </p>
      </InfoSection>

      <InfoSection heading="Something wrong with an order?">
        <p>
          Message us on the same WhatsApp thread you ordered on, so the whole history is in one
          place. If the size is wrong, tell us within 3 days of delivery and keep the shirt unworn
          with its tags.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
