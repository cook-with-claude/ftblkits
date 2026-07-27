// Shared limits used by both the admin forms and server-side validation.
export const PRODUCT_LIMITS = {
  name: 120,
  team: 80,
  description: 1000,
  size: 24,
  sizes: 20,
  price: 100_000,
  sections: 12,
} as const;

// Shared by the section admin forms and server-side validation, the same way
// PRODUCT_LIMITS is. Mirrors the CHECK constraints on public.sections.
export const SECTION_LIMITS = {
  slug: 60,
  label: 60,
  description: 300,
} as const;
