import type { Metadata } from "next";
import { InfoLink, InfoPage, InfoSection } from "@/components/InfoPage";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { WHATSAPP_NUMBER } from "@/lib/config";
import {
  DELIVERY_LONG,
  EXCHANGE_LONG,
  LEAD_TIME_LONG,
  PHONE_DISPLAY,
} from "@/lib/shop-info";
import { SIZE_ADVICE, SIZE_DISCLAIMER } from "@/lib/sizing";
import { MYSTERY_EXCLUSION, MYSTERY_GUARANTEE } from "@/lib/mystery";

const DESCRIPTION =
  "Delivery times, costs, exchanges and sizing for replica football kits from The Goal Zone in Beirut.";

export const metadata: Metadata = {
  title: "FAQ",
  description: DESCRIPTION,
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ | The Goal Zone",
    description: DESCRIPTION,
    type: "website",
    url: "/faq",
    images: ["/logo.jpeg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ | The Goal Zone",
    description: DESCRIPTION,
    images: ["/logo.jpeg"],
  },
};

const waLink = buildWhatsappLink(WHATSAPP_NUMBER, "Hi GoalZone! I have a question.");

export default function FaqPage() {
  return (
    <InfoPage
      title="Questions"
      intro="The things worth knowing before you order, answered straight. If something here is still unclear, ask us — a real person reads the WhatsApp line."
    >
      {/* Delivery leads deliberately: it is the answer most likely to change
          someone's mind, and the worst one to discover after paying. */}
      <InfoSection heading="How long does delivery take?">
        <p>{LEAD_TIME_LONG}</p>
      </InfoSection>

      <InfoSection heading="What does delivery cost?">
        <p>{DELIVERY_LONG}</p>
      </InfoSection>

      <InfoSection heading="What if the size is wrong?">
        <p>{EXCHANGE_LONG}</p>
        <p>
          Check the measurements before you order — every kit page has a size guide, and the
          tables are different for current-season and retro shirts.
        </p>
      </InfoSection>

      <InfoSection heading="How do the sizes run?">
        <p>{SIZE_ADVICE}</p>
        <p>{SIZE_DISCLAIMER}</p>
      </InfoSection>

      <InfoSection heading="Are these official shirts?">
        <p>
          No. These are replica kits, and we say so on every page. They are not licensed by any
          club, league or federation, and we do not claim they are. What you are buying is a
          well-made copy at a fraction of the official price — which is the whole point.
        </p>
      </InfoSection>

      <InfoSection heading="How do I pay?">
        <p>
          Cash, when the kit reaches you. There is no checkout on this site, no card details to
          enter and nothing taken up front. You pick the kits, the site opens WhatsApp with your
          order already written out, and we take it from there.
        </p>
      </InfoSection>

      <InfoSection heading="What is in a mystery box?">
        <p>{MYSTERY_GUARANTEE}</p>
        <p>{MYSTERY_EXCLUSION}</p>
        <p>
          Each box is priced below the kit it contains — the discount is what you get for letting
          us choose. You can add a preference (a club, a colour, &ldquo;no away kits&rdquo;) when
          you order and we will work around it where stock allows.
        </p>
      </InfoSection>

      <InfoSection heading="Can I order a kit you do not list?">
        <p>
          Often, yes. We order from our suppliers in batches, so a shirt that is not on the site
          can usually be added to the next one. Message us with the club, season and size and we
          will tell you whether it is possible and what it would cost.
        </p>
      </InfoSection>

      <InfoSection heading="How do I reach you?">
        <p>
          WhatsApp is fastest: <InfoLink href={waLink}>message us</InfoLink>, or save{" "}
          {PHONE_DISPLAY}. More ways to get in touch are on the{" "}
          <InfoLink href="/contact">contact page</InfoLink>.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
