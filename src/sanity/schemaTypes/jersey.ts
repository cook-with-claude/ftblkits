import { defineArrayMember, defineField, defineType } from "sanity";

export const jersey = defineType({
  name: "jersey",
  title: "Jersey",
  type: "document",
  fields: [
    defineField({ name: "team", title: "Team", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "kitType",
      title: "Kit type",
      type: "string",
      options: { list: ["Home", "Away", "Third"], layout: "radio" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: (doc) => `${doc.team}-${doc.kitType}`, maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "confederation",
      title: "Confederation",
      type: "reference",
      to: [{ type: "confederation" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "price",
      title: "Price (USD)",
      type: "number",
      validation: (r) => r.required().min(0),
    }),
    defineField({
      name: "photos",
      title: "Photos",
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [{ name: "alt", title: "Alt text", type: "string" }],
        }),
      ],
      validation: (r) => r.min(1).max(4),
    }),
    defineField({
      name: "sizes",
      title: "Sizes",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            {
              name: "size",
              title: "Size",
              type: "string",
              options: { list: ["S", "M", "L", "XL", "XXL"] },
            },
            { name: "inStock", title: "In stock", type: "boolean", initialValue: true },
          ],
          preview: {
            select: { title: "size", inStock: "inStock" },
            prepare: ({ title, inStock }) => ({
              title,
              subtitle: inStock ? "In stock" : "Sold out",
            }),
          },
        }),
      ],
    }),
    defineField({ name: "featured", title: "Featured", type: "boolean", initialValue: false }),
  ],
  preview: {
    select: { title: "team", subtitle: "kitType", media: "photos.0" },
  },
});
