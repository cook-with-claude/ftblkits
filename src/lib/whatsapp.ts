// Message building lives in src/lib/cart.ts. A single kit is now just a one-line
// cart, so the express button and the cart produce the same format.

export function buildWhatsappLink(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
