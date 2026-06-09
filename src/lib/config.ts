// WhatsApp ordering config. The number is set once via env (rarely changes);
// the catalog itself lives in Supabase.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

// Tokens: {name} {size} {price} {link}
export const ORDER_MESSAGE_TEMPLATE =
  "Hi GoalZone! I'd like to order: {name} - Size {size}. ${price}. {link}";
