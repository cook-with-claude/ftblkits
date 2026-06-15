import { describe, it, expect } from "vitest";
import { buildOrderMessage, buildWhatsappLink } from "@/lib/whatsapp";

describe("buildOrderMessage", () => {
  it("substitutes all tokens including quantity", () => {
    const tpl = "Order: {quantity}x {name} — Size {size}.{notes}";
    const msg = buildOrderMessage(tpl, {
      name: "Argentina Home",
      size: "L",
      quantity: 2,
      notes: "",
    });
    expect(msg).toBe("Order: 2x Argentina Home — Size L.");
  });

  it("appends a pre-formatted notes line when present", () => {
    const tpl = "Order: {quantity}x {name} (Size {size}).{notes}";
    const msg = buildOrderMessage(tpl, {
      name: "Mystery Kit",
      size: "M",
      quantity: 1,
      notes: "\nSpecial request: prefer an away kit",
    });
    expect(msg).toBe("Order: 1x Mystery Kit (Size M).\nSpecial request: prefer an away kit");
  });

  it("carries no page link or price", () => {
    const msg = buildOrderMessage("{name} {size} x{quantity}{notes}", {
      name: "x",
      size: "y",
      quantity: 1,
      notes: "",
    });
    expect(msg).not.toContain("http");
    expect(msg).not.toContain("$");
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
