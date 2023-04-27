import { Config } from "payload/config";
import { CollectionConfig, Field, RelationshipField } from "payload/types";

// aliasing for clarification
export type locale = string;

export type BackpopPluginConfig = {};

export type SimpleRelationshipArgs = {
  incomingConfig: Partial<Config>;
  relationTo: string;
  collection: CollectionConfig;
  field: RelationshipField;
};

export type PolymorphicRelationshipArgs = {
  incomingConfig: Partial<Config>;
  relationTo: string;
  collection: CollectionConfig;
  field: RelationshipField;
};

export type SimpleHookArgs = {
  targetCollection: CollectionConfig;
  backpopulatedField: Field & { name: string };
  originalField: Field & { name: string };
};

export type PolymorphicHookArgs = {
  // polymorphic hooks need to be aware of their own slug, otherwise
  // we can not determine if the document is part of the afterchange value
  primaryCollection: CollectionConfig;
  targetCollection: CollectionConfig;
  backpopulatedField: Field & { name: string };
};

// fields which can be recursively traversed
export const traversableFieldTypes = [
  "group",
  "array",
  "tabs",
  "collapsible",
  "row",
];
