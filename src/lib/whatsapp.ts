export interface OrderVars {
  name: string;
  size: string;
  quantity: number;
  /** Pre-formatted extra line(s) — e.g. a mystery special request — or "" when none. */
  notes: string;
}

export function buildOrderMessage(template: string, vars: OrderVars): string {
  return template
    .replaceAll("{name}", vars.name)
    .replaceAll("{size}", vars.size)
    .replaceAll("{quantity}", String(vars.quantity))
    .replaceAll("{notes}", vars.notes);
}

export function buildWhatsappLink(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
