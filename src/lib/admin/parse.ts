// Shared body-parsing primitives, extracted from server.ts so the products and
// sections parsers use one implementation instead of two copies.

// Presence check rather than a truthiness check: PATCH bodies must be able to
// send an explicit null or false without the key looking absent.
export function hasKey(body: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(body, key);
}

// Strict on purpose: 1/0/"yes" are rejected rather than guessed at, so a
// malformed client can't silently flip a kit's visibility.
export function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
}

export function asRecord(body: unknown): Record<string, unknown> | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}
