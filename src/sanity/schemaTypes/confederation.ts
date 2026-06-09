import { defineField, defineType } from "sanity";

export const confederation = defineType({
  name: "confederation",
  title: "Confederation",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "id",
      title: "ID",
      type: "string",
      description: "europe, south-america, africa, asia, north-america, oceania",
      validation: (r) => r.required(),
    }),
  ],
});
