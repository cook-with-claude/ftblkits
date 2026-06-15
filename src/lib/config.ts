// WhatsApp ordering config. The number is set once via env (rarely changes);
// the catalog itself lives in Supabase.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

// Tokens: {name} {size} {quantity} {notes}
// {notes} is a pre-formatted extra line (or "") so the template stays a single string.
export const ORDER_MESSAGE_TEMPLATE =
  "Hi GoalZone! I'd like to order:\n{quantity}x {name} — Size {size}.{notes}";
