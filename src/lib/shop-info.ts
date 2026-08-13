// How the shop actually works, in one place.
//
// These facts appear on the product page, in the FAQ, on /contact and inside
// the WhatsApp conversation. Written down once because the moment the delivery
// window lives in three files it starts saying three different things — and the
// one number a first-time buyer most needs to trust is exactly that window.

import { WHATSAPP_NUMBER } from "@/lib/config";

/**
 * The number as a human can read it, derived from the same env var the wa.me
 * links use. It existed only inside those URLs before, which meant a customer
 * who wanted to call rather than message had nothing to copy.
 *
 * Falls back to returning the digits unchanged for any shape this does not
 * recognise, so a reformatted env var degrades to "still correct, less pretty".
 */
export function formatPhone(digits = WHATSAPP_NUMBER): string {
  const clean = digits.replace(/\D/g, "");
  // Lebanon: 961 + an 7-or-8-digit subscriber number.
  const match = clean.match(/^961(\d{1,2})(\d{3})(\d{3})$/);
  return match ? `+961 ${match[1]} ${match[2]} ${match[3]}` : clean ? `+${clean}` : "";
}

export const PHONE_DISPLAY = formatPhone();

/**
 * The honest answer, and deliberately the first thing said rather than the last.
 * Kits are ordered from the supplier per batch, not per customer, because
 * single orders cost significantly more — the saving is why the prices are what
 * they are. Two weeks is a long wait to discover after paying.
 */
export const LEAD_TIME_SHORT = "About 2 weeks";
export const LEAD_TIME_LONG =
  "We order from our supplier in batches rather than one kit at a time, which is what keeps the prices where they are. Expect about two weeks from order to delivery — sometimes less, occasionally a little more, depending on where your kit falls in a batch. We tell you which batch yours is in when you order.";

export const DELIVERY_SHORT = "Free in Beirut · $3 elsewhere in Lebanon";
export const DELIVERY_LONG =
  "Delivery inside Beirut is free. Anywhere else in Lebanon is a flat $3. You pay cash when the kit reaches you — there is no payment up front and no card details to hand over.";

export const EXCHANGE_SHORT = "Size exchange within 3 days";
export const EXCHANGE_LONG =
  "If the size is wrong, message us within 3 days of delivery and we will swap it, as long as the shirt is unworn and still has its tags. Exchanges are size-for-size on the same kit; we do not refund, because each shirt is ordered in for you specifically.";

export const SIZING_SHORT = "Runs small — size up if you are between";
