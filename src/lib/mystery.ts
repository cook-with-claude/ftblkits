export function mysteryKitDescription(name: string): string {
  if (/\bpro\b/i.test(name)) {
    return "A premium surprise replica kit selected from current in-stock national-team styles. Choose your size and we will keep the team a surprise.";
  }
  return "A surprise replica national-team kit selected from current in-stock styles. Choose your size and we will handle the rest.";
}
