// Shared limits used by both the admin forms and server-side validation.
export const PRODUCT_LIMITS = {
  name: 120,
  team: 80,
  description: 1000,
  size: 24,
  sizes: 20,
  price: 100_000,
} as const;
