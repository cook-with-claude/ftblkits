// Pure cart logic — no React, no storage, no Supabase, so it stays trivially
// unit-testable. Same character as src/lib/catalog.ts.
//
// SITE_URL is the one import, and it is a plain string derived from env with a
// safe fallback, so this file stays pure and the tests stay deterministic.

import { SITE_URL } from "@/lib/config";

export const MAX_LINE_QUANTITY = 99;

export interface CartLine {
  id: string;
  size: string;
  quantity: number;
  // A snapshot rather than just an id, so the panel renders with no fetch. A kit
  // can sell out or be renamed while it sits in someone's cart; because every
  // order is confirmed by hand on WhatsApp, that is a conversation, not a bug.
  name: string;
  team: string;
  price: number;
  imageUrl: string | null;
  isMystery: boolean;
  // Mystery-only "special request", carried per line so two mystery boxes can
  // ask for different things.
  notes?: string;
}

// The same kit in M and in L are two different things to order, so size is part
// of the identity. Adding an existing key increments instead of duplicating.
export function lineKey(id: string, size: string): string {
  return `${id}__${size}`;
}

function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.floor(value)));
}

export function addLine(lines: CartLine[], line: CartLine): CartLine[] {
  const key = lineKey(line.id, line.size);
  const existing = lines.find((l) => lineKey(l.id, l.size) === key);

  if (!existing) return [...lines, { ...line, quantity: clampQuantity(line.quantity) }];

  return lines.map((l) =>
    lineKey(l.id, l.size) === key
      ? {
          ...l,
          quantity: clampQuantity(l.quantity + line.quantity),
          // A later note replaces an earlier one; an empty one leaves it alone,
          // so re-adding without typing a request does not wipe the first.
          notes: line.notes?.trim() ? line.notes : l.notes,
        }
      : l,
  );
}

export function removeLine(lines: CartLine[], id: string, size: string): CartLine[] {
  const key = lineKey(id, size);
  return lines.filter((l) => lineKey(l.id, l.size) !== key);
}

// Setting 0 (or less) removes the line, so the stepper's minus button can empty
// a row without a separate code path.
export function setLineQuantity(
  lines: CartLine[],
  id: string,
  size: string,
  quantity: number,
): CartLine[] {
  if (quantity <= 0) return removeLine(lines, id, size);
  const key = lineKey(id, size);
  return lines.map((l) =>
    lineKey(l.id, l.size) === key ? { ...l, quantity: clampQuantity(quantity) } : l,
  );
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function cartTotal(lines: CartLine[]): number {
  const cents = lines.reduce(
    (total, line) => total + Math.round(line.price * 100) * line.quantity,
    0,
  );
  return cents / 100;
}

// Whole dollars stay whole ($40, not $40.00); priced tiers like $29.99 keep
// their cents.
export function formatPrice(value: number): string {
  return Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`;
}

// Discards anything that does not look like a line we wrote. Storage is
// user-editable and survives deploys, so a stale or hand-edited value must not
// be able to break the panel.
export function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    typeof v.size === "string" &&
    typeof v.name === "string" &&
    typeof v.team === "string" &&
    typeof v.price === "number" &&
    Number.isFinite(v.price) &&
    typeof v.quantity === "number" &&
    Number.isFinite(v.quantity) &&
    v.quantity > 0 &&
    (v.imageUrl === null || typeof v.imageUrl === "string") &&
    typeof v.isMystery === "boolean"
  );
}

export function parseCart(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isCartLine).map((line) => ({ ...line, quantity: clampQuantity(line.quantity) }));
}

export const CART_GREETING = "Hi GoalZone! I'd like to order:";

/**
 * The details every order needed anyway. Sent as blank fields rather than as a
 * question, so the customer fills them in before the first reply instead of the
 * shop opening each conversation by asking for the same three things.
 */
export const DELIVERY_PROMPT = ["To arrange delivery:", "Name:", "Area:", "Phone:"];

/** The public page for a kit — what makes a forwarded order message clickable. */
export function productUrl(id: string): string {
  return `${SITE_URL}/jersey/${id}`;
}

/**
 * One message for the whole order.
 *
 * Prices are included here and on the single-kit path alike. They were removed
 * in June, but a multi-line order that never states a number is awkward for both
 * sides; the figure is a starting point the shop can still adjust in chat.
 *
 * Each line now carries its product URL. The message is the only artefact that
 * survives the handoff into WhatsApp: without a link, "Arsenal 25/26 Home" in a
 * chat is a name the shop has to look up by hand, and a customer forwarding the
 * order to a friend forwards nothing they can buy from. The id was already on
 * the record, so this costs one string per line.
 *
 * `trailingLines` exists for the referral/salesperson work, which appends
 * "Referred by:" / "Sold by:" once per order rather than once per line — after
 * the delivery block, so the fields the customer types into stay together.
 */
export function buildCartMessage(lines: CartLine[], trailingLines: string[] = []): string {
  if (lines.length === 0) return "";

  const body = lines.flatMap((line) => {
    const lineTotal = formatPrice(cartTotal([line]));
    const out = [`${line.quantity}x ${line.name} — Size ${line.size} — ${lineTotal}`];
    const request = line.notes?.trim();
    if (request) out.push(`  Special request: ${request}`);
    out.push(`  ${productUrl(line.id)}`);
    return out;
  });

  const parts = [
    CART_GREETING,
    ...body,
    "",
    `Total: ${formatPrice(cartTotal(lines))}`,
    "",
    ...DELIVERY_PROMPT,
  ];
  if (trailingLines.length > 0) parts.push("", ...trailingLines);
  return parts.join("\n");
}
