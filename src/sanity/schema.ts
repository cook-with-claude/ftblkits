import type { SchemaTypeDefinition } from "sanity";
import { confederation } from "./schemaTypes/confederation";
import { jersey } from "./schemaTypes/jersey";
import { siteSettings } from "./schemaTypes/siteSettings";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [jersey, confederation, siteSettings],
};
