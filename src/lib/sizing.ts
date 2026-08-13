// Size guidance for replica kits. Pure data + pure functions, no React, so it
// stays trivially unit-testable — same character as src/lib/cart.ts.
//
// **These are approximate.** They are the published measurements typical of the
// Asian replica shirts we stock, not figures measured off our own rail. Every
// surface that renders them says so, because a size chart that looks
// authoritative and is off by 2cm costs more trust than no chart at all.
// Replace with measured figures when a batch has actually been measured.
//
// Two tables, not one. 1980s–90s patterns are cut differently from a current
// season shirt: boxier through the chest and shorter in the body. Publishing
// the modern numbers against a 1997 Napoli shirt would be wrong in a way that
// is worse than silence.

export type SizeChartKind = "modern" | "retro";

export interface SizeRow {
  size: string;
  /** Pit to pit with the shirt laid flat — the measurement people can check. */
  chestFlatCm: number;
  /** High point of the shoulder straight down to the hem. */
  bodyLengthCm: number;
}

export interface SizeChart {
  kind: SizeChartKind;
  label: string;
  /** What is different about this cut, in one sentence. */
  note: string;
  rows: SizeRow[];
}

const MODERN: SizeChart = {
  kind: "modern",
  label: "Current-season kits",
  note: "Standard replica cut — straight through the body with a regular fit.",
  rows: [
    { size: "S", chestFlatCm: 48, bodyLengthCm: 68 },
    { size: "M", chestFlatCm: 50, bodyLengthCm: 70 },
    { size: "L", chestFlatCm: 53, bodyLengthCm: 72 },
    { size: "XL", chestFlatCm: 55, bodyLengthCm: 74 },
    { size: "XXL", chestFlatCm: 58, bodyLengthCm: 76 },
  ],
};

const RETRO: SizeChart = {
  kind: "retro",
  label: "Retro kits",
  note: "Cut to the original pattern — roomier across the chest and shorter in the body than a current kit.",
  rows: [
    { size: "S", chestFlatCm: 50, bodyLengthCm: 66 },
    { size: "M", chestFlatCm: 53, bodyLengthCm: 69 },
    { size: "L", chestFlatCm: 55, bodyLengthCm: 71 },
    { size: "XL", chestFlatCm: 58, bodyLengthCm: 73 },
    { size: "XXL", chestFlatCm: 61, bodyLengthCm: 75 },
  ],
};

export const SIZE_CHARTS: SizeChart[] = [MODERN, RETRO];

export const RETRO_SECTION_SLUG = "retro-kits";

/** The one line that matters more than the table. */
export const SIZE_ADVICE =
  "These shirts run small next to European sizing. If you are between two sizes, take the larger one.";

export const SIZE_DISCLAIMER =
  "Approximate measurements, in centimetres, taken with the shirt laid flat. Expect up to 2cm of variation between batches — message us before ordering if a size is borderline and we will check the shirt itself.";

export function sizeChartKindFor(sections: string[]): SizeChartKind {
  return sections.includes(RETRO_SECTION_SLUG) ? "retro" : "modern";
}

export function sizeChartFor(sections: string[]): SizeChart {
  return sizeChartKindFor(sections) === "retro" ? RETRO : MODERN;
}

/** Rounded to the half inch — false precision reads as measured, and it is not. */
export function cmToInches(cm: number): number {
  return Math.round((cm / 2.54) * 2) / 2;
}

/**
 * Chest circumference the size is cut to fit, as a range in centimetres.
 * Doubling the flat measurement gives the garment's own circumference; a shirt
 * is cut with ease over the body, so the wearer's chest sits below it.
 */
export function fitsChestCm(row: SizeRow): [number, number] {
  const garment = row.chestFlatCm * 2;
  return [garment - 12, garment - 6];
}
