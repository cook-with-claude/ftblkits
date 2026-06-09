import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "whatsappNumber",
      title: "WhatsApp number (international, digits only)",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "orderMessageTemplate",
      title: "Order message template",
      type: "text",
      description:
        "Use tokens {team} {kit} {size} {price} {link}. Example: Hi GoalZone! I'd like to order: {team} - {kit} - Size {size}. ${price}. {link}",
      validation: (r) => r.required(),
    }),
  ],
});
