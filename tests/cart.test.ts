import { describe, it, expect } from "vitest";
import {
  addLine,
  removeLine,
  setLineQuantity,
  cartCount,
  cartTotal,
  formatPrice,
  buildCartMessage,
  parseCart,
  lineKey,
  productUrl,
  DELIVERY_PROMPT,
  MAX_LINE_QUANTITY,
  type CartLine,
} from "@/lib/cart";

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    id: overrides.id ?? "real-madrid",
    size: overrides.size ?? "M",
    quantity: overrides.quantity ?? 1,
    name: overrides.name ?? "Real Madrid Home",
    team: overrides.team ?? "Real Madrid",
    price: overrides.price ?? 30,
    imageUrl: overrides.imageUrl ?? null,
    isMystery: overrides.isMystery ?? false,
    notes: overrides.notes,
  };
}

describe("addLine", () => {
  it("adds a new kit", () => {
    expect(addLine([], line()).length).toBe(1);
  });

  // The bug carts most often ship: same kit, different size, silently merged.
  it("keeps the same kit in different sizes as separate lines", () => {
    const cart = addLine(addLine([], line({ size: "M" })), line({ size: "L" }));
    expect(cart.length).toBe(2);
    expect(cart.map((l) => l.size)).toEqual(["M", "L"]);
  });

  it("increments instead of duplicating when the kit and size match", () => {
    const cart = addLine(addLine([], line({ quantity: 2 })), line({ quantity: 2 }));
    expect(cart.length).toBe(1);
    expect(cart[0].quantity).toBe(4);
  });

  it("clamps a runaway quantity", () => {
    const cart = addLine([], line({ quantity: 500 }));
    expect(cart[0].quantity).toBe(MAX_LINE_QUANTITY);
  });

  it("does not mutate the input", () => {
    const original = [line()];
    addLine(original, line({ size: "L" }));
    expect(original.length).toBe(1);
  });

  it("keeps an earlier mystery request when the kit is re-added without one", () => {
    const withNote = addLine([], line({ isMystery: true, notes: "prefer an away kit" }));
    const again = addLine(withNote, line({ isMystery: true }));
    expect(again[0].notes).toBe("prefer an away kit");
  });

  it("replaces the request when a new one is given", () => {
    const withNote = addLine([], line({ isMystery: true, notes: "away kit" }));
    const again = addLine(withNote, line({ isMystery: true, notes: "no goalkeeper kits" }));
    expect(again[0].notes).toBe("no goalkeeper kits");
  });
});

describe("removeLine / setLineQuantity", () => {
  const cart = [line({ size: "M" }), line({ size: "L" })];

  it("removes only the matching size", () => {
    expect(removeLine(cart, "real-madrid", "M").map((l) => l.size)).toEqual(["L"]);
  });

  it("sets a quantity", () => {
    expect(setLineQuantity(cart, "real-madrid", "M", 5)[0].quantity).toBe(5);
  });

  it("treats zero as a removal, so the minus button can empty a row", () => {
    expect(setLineQuantity(cart, "real-madrid", "M", 0).map((l) => l.size)).toEqual(["L"]);
  });

  it("clamps to the maximum", () => {
    expect(setLineQuantity(cart, "real-madrid", "M", 9999)[0].quantity).toBe(MAX_LINE_QUANTITY);
  });
});

describe("cartCount / cartTotal", () => {
  it("counts kits, not lines", () => {
    expect(cartCount([line({ quantity: 2 }), line({ size: "L", quantity: 3 })])).toBe(5);
  });

  // The mystery tier is $26.99, so float drift is a real risk here.
  it("totals decimal prices exactly", () => {
    expect(cartTotal([line({ price: 26.99, quantity: 3 })])).toBe(80.97);
    expect(cartTotal([line({ price: 26.99 }), line({ size: "L", price: 0.1, quantity: 2 })])).toBe(
      27.19,
    );
  });

  it("is zero for an empty cart", () => {
    expect(cartTotal([])).toBe(0);
    expect(cartCount([])).toBe(0);
  });
});

describe("formatPrice", () => {
  it("keeps whole dollars whole and cents visible", () => {
    expect(formatPrice(30)).toBe("$30");
    expect(formatPrice(26.99)).toBe("$26.99");
  });
});

describe("buildCartMessage", () => {
  it("is empty for an empty cart, so no link is built", () => {
    expect(buildCartMessage([])).toBe("");
  });

  it("lists one kit with its line total and an overall total", () => {
    const msg = buildCartMessage([line({ quantity: 2 })]);
    expect(msg).toContain("2x Real Madrid Home — Size M — $60");
    expect(msg).toContain("Total: $60");
  });

  it("puts every kit in a single message", () => {
    const msg = buildCartMessage([
      line({ id: "rm", name: "Real Madrid Home", size: "M", quantity: 2 }),
      line({ id: "fcb", name: "Barcelona Away", size: "L", quantity: 2 }),
    ]);
    expect(msg).toContain("2x Real Madrid Home — Size M — $60");
    expect(msg).toContain("2x Barcelona Away — Size L — $60");
    expect(msg).toContain("Total: $120");
  });

  it("includes a mystery request under its own line and omits it when absent", () => {
    const withNote = buildCartMessage([
      line({ isMystery: true, name: "Mystery Box", notes: "prefer an away kit" }),
    ]);
    expect(withNote).toContain("Special request: prefer an away kit");

    expect(buildCartMessage([line({ isMystery: true, name: "Mystery Box" })])).not.toContain(
      "Special request",
    );
  });

  it("appends trailing lines once per order, not per kit", () => {
    const msg = buildCartMessage([line(), line({ size: "L" })], ["Referred by: AB12CD"]);
    expect(msg.match(/Referred by/g)?.length).toBe(1);
    expect(msg.trimEnd().endsWith("Referred by: AB12CD")).toBe(true);
  });

  it("always states a total — the reason prices came back into the message", () => {
    expect(buildCartMessage([line()])).toMatch(/Total: \$\d/);
  });

  it("links every kit to its page, so the shop is not looking names up by hand", () => {
    const msg = buildCartMessage([line({ id: "rm" }), line({ id: "fcb", size: "L" })]);
    expect(msg).toContain(productUrl("rm"));
    expect(msg).toContain(productUrl("fcb"));
  });

  it("keeps the link with its own kit, under the line it belongs to", () => {
    const rows = buildCartMessage([line({ id: "rm", name: "Real Madrid Home" })]).split("\n");
    const kitRow = rows.findIndex((r) => r.includes("Real Madrid Home"));
    expect(rows[kitRow + 1].trim()).toBe(productUrl("rm"));
  });

  it("asks for the delivery details up front, once per order", () => {
    const msg = buildCartMessage([line(), line({ size: "L" })]);
    for (const field of DELIVERY_PROMPT) {
      expect(msg.match(new RegExp(field, "g"))?.length).toBe(1);
    }
  });

  it("puts the delivery block after the total, so the order reads first", () => {
    const msg = buildCartMessage([line()]);
    expect(msg.indexOf("Total:")).toBeLessThan(msg.indexOf("Name:"));
  });
});

describe("parseCart", () => {
  it("keeps well-formed lines", () => {
    expect(parseCart([line()]).length).toBe(1);
  });

  // Storage is user-editable and survives deploys, so junk must not reach render.
  it("drops anything that is not a cart line", () => {
    expect(parseCart([line(), null, "nope", 42, {}, { id: "x" }]).length).toBe(1);
  });

  it("returns an empty cart for a non-array", () => {
    expect(parseCart(null)).toEqual([]);
    expect(parseCart({ id: "x" })).toEqual([]);
  });

  it("rejects a zero or negative stored quantity", () => {
    expect(parseCart([line({ quantity: 0 }), line({ size: "L", quantity: -3 })])).toEqual([]);
  });
});

describe("lineKey", () => {
  it("distinguishes kit and size", () => {
    expect(lineKey("a", "M")).not.toBe(lineKey("a", "L"));
    expect(lineKey("a", "M")).toBe(lineKey("a", "M"));
  });
});
