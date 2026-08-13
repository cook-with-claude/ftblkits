import type { Metadata } from "next";
import { InfoLink, InfoPage, InfoSection } from "@/components/InfoPage";
import { PHONE_DISPLAY } from "@/lib/shop-info";

const DESCRIPTION =
  "What The Goal Zone does and does not collect. There are no accounts, no analytics and no card details.";

export const metadata: Metadata = {
  title: "Privacy",
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy | The Goal Zone",
    description: DESCRIPTION,
    type: "website",
    url: "/privacy",
    images: ["/logo.jpeg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy | The Goal Zone",
    description: DESCRIPTION,
    images: ["/logo.jpeg"],
  },
};

export default function PrivacyPage() {
  return (
    // Deliberately not boilerplate. This site genuinely collects almost
    // nothing, and describing that plainly is worth more than a template that
    // claims practices we do not have.
    <InfoPage
      title="Privacy"
      intro="Short, because there is not much to disclose. This site has no accounts, no analytics, no checkout and no advertising trackers."
    >
      <InfoSection heading="What this site stores">
        <p>
          Your cart, and only in your own browser. It is kept in that browser&rsquo;s local
          storage so the kits are still there when you come back — it is never sent to us and
          never leaves your device. Clearing your browser data clears it.
        </p>
        <p>
          There are no accounts to create, no cookies set for tracking, no analytics script, and
          no advertising pixels of any kind.
        </p>
      </InfoSection>

      <InfoSection heading="What we learn when you order">
        <p>
          Ordering opens WhatsApp with your kits written into a message. Everything we know about
          you comes from that conversation — your name, the area you want the kit delivered to,
          your phone number, and what you ordered. We use it to get the kit to you, and we keep
          the chat history so a later question about an old order can be answered.
        </p>
        <p>
          The message travels through WhatsApp, which is Meta&rsquo;s service and covered by
          Meta&rsquo;s own privacy policy, not ours.
        </p>
      </InfoSection>

      <InfoSection heading="Payments">
        <p>
          Cash on delivery. We never see or store card numbers, bank details or any payment
          credentials, because none are ever entered.
        </p>
      </InfoSection>

      <InfoSection heading="Who else is involved">
        <p>
          The site is hosted on Netlify and its catalogue lives in a Supabase database; both keep
          ordinary server logs, which include IP addresses, as any web host does. Product photos
          load from that same Supabase project. Fonts are served from Google Fonts. We have a
          Google Search Console verification tag on the site, which lets us see search statistics
          about the site itself — not about you.
        </p>
      </InfoSection>

      <InfoSection heading="Your data">
        <p>
          Ask us to delete your order history and we will, on the same WhatsApp thread. There is
          nothing else of yours to delete, because there is nothing else of yours here.
        </p>
        <p>
          Questions about any of this: {PHONE_DISPLAY}, or the{" "}
          <InfoLink href="/contact">contact page</InfoLink>.
        </p>
      </InfoSection>

      <InfoSection heading="Changes">
        <p>
          If we ever add analytics, accounts or online payments, this page changes first. Last
          updated August 2026.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
