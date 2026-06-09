import { describe, it, expect } from "vitest";
import { buildOrderMessage, buildWhatsappLink } from "@/lib/whatsapp";

describe("buildOrderMessage", () => {
  it("substitutes all tokens", () => {
    const tpl = "Hi GoalZone! I'd like to order: {name} - Size {size}. ${price}. {link}";
    const msg = buildOrderMessage(tpl, {
      name: "Argentina Home",
      size: "L",
      price: 28,
      link: "https://goalzone.example/jersey/abc",
    });
    expect(msg).toBe(
      "Hi GoalZone! I'd like to order: Argentina Home - Size L. $28. https://goalzone.example/jersey/abc",
    );
  });
});

describe("buildWhatsappLink", () => {
  it("builds a wa.me url with encoded message", () => {
    const url = buildWhatsappLink("9613123456", "Hi there & welcome");
    expect(url).toBe("https://wa.me/9613123456?text=Hi%20there%20%26%20welcome");
  });
  it("strips non-digits from the phone number", () => {
    const url = buildWhatsappLink("+961 3 123 456", "x");
    expect(url.startsWith("https://wa.me/9613123456?text=")).toBe(true);
  });
});
