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

  it("still carries no page link", () => {
    expect(buildCartMessage([])).not.toContain("http");
  });
});
