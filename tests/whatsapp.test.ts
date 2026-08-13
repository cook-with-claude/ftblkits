import { describe, it, expect } from "vitest";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { buildCartMessage, type CartLine } from "@/lib/cart";

// buildOrderMessage and ORDER_MESSAGE_TEMPLATE retired with the cart: a single
// kit is now a one-line cart, so both paths share buildCartMessage. Its own
// coverage lives in tests/cart.test.ts.

describe("buildWhatsappLink", () => {
  it("builds a wa.me url with encoded message", () => {
    const url = buildWhatsappLink("9613123456", "Hi there & welcome");
    expect(url).toBe("https://wa.me/9613123456?text=Hi%20there%20%26%20welcome");
  });

  it("strips non-digits from the phone number", () => {
    const url = buildWhatsappLink("+961 3 123 456", "x");
    expect(url.startsWith("https://wa.me/9613123456?text=")).toBe(true);
  });

  it("encodes the newlines a multi-kit order is full of", () => {
    const lines: CartLine[] = [
      {
        id: "a",
        size: "M",
        quantity: 2,
        name: "Real Madrid Home",
        team: "Real Madrid",
        price: 30,
        imageUrl: null,
        isMystery: false,
      },
    ];
    const url = buildWhatsappLink("9613123456", buildCartMessage(lines));
    expect(url).not.toContain("\n");
    expect(decodeURIComponent(url.split("?text=")[1])).toContain("2x Real Madrid Home");
  });

  // Inverted deliberately. This used to assert the message carried no page
  // link, which was true and was the problem: the shop received kit names it
  // then had to look up by hand, and a forwarded order led nowhere.
  it("carries a clickable product link per kit, encoded", () => {
    const lines: CartLine[] = [
      {
        id: "692f94a4-6ad5-47dd-a155-b6fd0199d514",
        size: "M",
        quantity: 1,
        name: "Real Madrid Home",
        team: "Real Madrid",
        price: 30,
        imageUrl: null,
        isMystery: false,
      },
    ];
    const url = buildWhatsappLink("9613123456", buildCartMessage(lines));
    expect(url).not.toContain("\n");
    expect(decodeURIComponent(url.split("?text=")[1])).toContain(
      "/jersey/692f94a4-6ad5-47dd-a155-b6fd0199d514",
    );
  });

  it("builds nothing at all for an empty cart, so there is no link to send", () => {
    expect(buildCartMessage([])).toBe("");
  });
});
