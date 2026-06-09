export interface OrderVars {
  name: string;
  size: string;
  price: number;
  link: string;
}

export function buildOrderMessage(template: string, vars: OrderVars): string {
  return template
    .replaceAll("{name}", vars.name)
    .replaceAll("{size}", vars.size)
    .replaceAll("{price}", String(vars.price))
    .replaceAll("{link}", vars.link);
}

export function buildWhatsappLink(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
