export interface OrderVars {
  team: string;
  kit: string;
  size: string;
  price: number;
  link: string;
}

export function buildOrderMessage(template: string, vars: OrderVars): string {
  return template
    .replaceAll("{team}", vars.team)
    .replaceAll("{kit}", vars.kit)
    .replaceAll("{size}", vars.size)
    .replaceAll("{price}", String(vars.price))
    .replaceAll("{link}", vars.link);
}

export function buildWhatsappLink(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
