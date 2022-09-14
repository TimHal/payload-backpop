import { Config } from "payload/config";
import { Field } from "payload/types";
import { backpopulateAfterChangeHookFactory } from "./hooks/backpopulate.hook";
import {
  backpopulateCleanupHookFactory,
  parentCleanupHookFactory,
} from "./hooks/backpopulate-cleanup.hook";
import backpopulate from "./hooks/backpopulate";
import backpopulatePolymorphicHookFactory from "./hooks/backpopulate-polymorphic.hook";

const BackpopulatedRelationshipsPlugin = (incomingConfig: Config) => {
  for (let collection of incomingConfig.collections) {
    for (let field of collection.fields) {
      if (field.type === "relationship" && field.relationTo) {
        if (field.hasOwnProperty("hooks")) {
          const hasMarker = field.hooks.afterChange.find(
            (hook) => hook === backpopulate
          );
          if (hasMarker) {
            // get the target collection
            // @ts-ignore es-lint-disable-line

            if (Array.isArray(field.relationTo)) {
              for (let relationTo of field.relationTo) {
                console.log("handling polymorphic");
                console.log(collection);
                console.log(field.relationTo);
                handlePolymorphicRelationship({
                  incomingConfig: incomingConfig,
                  relationTo: relationTo,
                  collection: collection,
                  field: field,
                });
              }
            } else {
              handleSimpleRelationship({
                incomingConfig: incomingConfig,
                relationTo: field["relationTo"],
                collection: collection,
                field: field,
              });
            }
          }
        }
      }
    }
  }

  return incomingConfig;
};

const handleSimpleRelationship = ({
  incomingConfig,
  relationTo,
  collection,
  field,
}) => {
  const targetCollection = incomingConfig.collections.find(
    (collection) => collection.slug === relationTo
  );
  const targetFieldName = `${collection.slug}_${field.name}_backpopulated`;
  // create a readonly hasMany relationship field on the target collection
  const backpopulatedField: Field = backpopulateCollectionField({
    targetFieldName: targetFieldName,
    sourceCollectionSlug: collection.slug,
  });
  // prepare the target (backpopulated) collections by adding relationship fields to marked collections.
  targetCollection.fields.push(backpopulatedField);

  // replace the marker hook with the actual backpopulation hook
  // remove the marker
  field.hooks.afterChange = field.hooks.afterChange.filter(
    (hook) => hook !== backpopulate
  );
  // add the backpopulate hook
  field.hooks.afterChange.push(
    backpopulateAfterChangeHookFactory({
      targetCollection: targetCollection,
      backpopulatedField: backpopulatedField,
      originalField: field,
    })
  );

  // the source collection also needs an afterDeleteHook to remove itself from the backpopulated fields on the target collection
  if (!collection.hasOwnProperty("hooks")) {
    collection.hooks = {};
  }
  if (!collection.hooks.hasOwnProperty("afterDelete")) {
    collection.hooks.afterDelete = [];
  }

  const collectionAfterDeleteHooks = collection.hooks.afterDelete || [];

  collection.hooks.afterDelete = [
    ...collectionAfterDeleteHooks,
    backpopulateCleanupHookFactory({
      source_field: field.name,
      target_field: backpopulatedField.name,
      target_slug: targetCollection.slug,
    }),
  ];

  //Now, handle what happens if the TARGET (collection with the backpopulated field) is deleted
  if (!targetCollection.hasOwnProperty("hooks")) {
    targetCollection.hooks = {};
  }
  if (!targetCollection.hooks.hasOwnProperty("afterDelete")) {
    targetCollection.hooks.afterDelete = [];
  }

  const targetCollectionAfterDeleteHooks =
    targetCollection.hooks.afterDelete || [];

  targetCollection.hooks.afterDelete = [
    ...targetCollectionAfterDeleteHooks,
    parentCleanupHookFactory({
      source_field: targetFieldName,
      target_field: field.name,
      target_slug: collection.slug,
    }),
  ];
};
const handlePolymorphicRelationship = ({
  incomingConfig,
  relationTo,
  collection,
  field,
}) => {
  const targetCollection = incomingConfig.collections.find(
    (collection) => collection.slug === relationTo
  );
  const targetFieldName = `${collection.slug}_${field.name}_backpopulated`;
  // create a readonly hasMany relationship field on the target collection
  const backpopulatedField: Field = backpopulateCollectionField({
    targetFieldName: targetFieldName,
    sourceCollectionSlug: collection.slug,
  });
  // prepare the target (backpopulated) collections by adding relationship fields to marked collections.
  targetCollection.fields.push(backpopulatedField);

  // replace the marker hook with the actual backpopulation hook
  // remove the marker
  field.hooks.afterChange = field.hooks.afterChange.filter(
    (hook) => hook !== backpopulate
  );
  // add the backpopulate hook
  field.hooks.afterChange.push(
    backpopulatePolymorphicHookFactory({
      primaryCollection: collection,
      targetCollection: targetCollection,
      backpopulatedField: backpopulatedField,
    })
  );

  // the source collection also needs an afterDeleteHook to remove itself from the backpopulated fields on the target collection
  if (!collection.hasOwnProperty("hooks")) {
    collection.hooks = {};
  }
  if (!collection.hooks.hasOwnProperty("afterDelete")) {
    collection.hooks.afterDelete = [];
  }

  const collectionAfterDeleteHooks = collection.hooks.afterDelete || [];

  collection.hooks.afterDelete = [
    ...collectionAfterDeleteHooks,
    backpopulateCleanupHookFactory({
      source_field: field.name,
      target_field: backpopulatedField.name,
      target_slug: targetCollection.slug,
    }),
  ];
};

const backpopulateCollectionField = ({
  targetFieldName,
  sourceCollectionSlug,
}) => {
  /**
   * Backpopulate a single relationship field on a collection (not global).
   * This method is executed for each (polymorphic) relation.
   */

  // create a readonly hasMany relationship field on the target collection
  const backpopulatedField: Field = {
    name: targetFieldName,
    type: "relationship",
    relationTo: sourceCollectionSlug,
    hasMany: true,
    access: {
      create: () => false,
      read: () => true,
      update: () => false,
    },
  };
  // prepare the target (backpopulated) collections by adding relationship fields to marked collections.
  return backpopulatedField;
};

export default BackpopulatedRelationshipsPlugin;
