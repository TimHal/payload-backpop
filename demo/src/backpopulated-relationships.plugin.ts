import { Config } from "payload/config";
import { Field } from "payload/types";
import { backpopulateHookFactory } from "./hooks/backpopulate.hook";
import backpopulateCleanupHookFactory from "./hooks/backpopulate-cleanup.hook";
import backpopulate from "./hooks/backpopulate";

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
            const relationsTo = Array.isArray(field.relationTo)
              ? field.relationTo
              : [field.relationTo];
            // if the input is a polymorphic field we want to respect that, if it is not-polymorphic cast the relationTo to an array
            for (let relationTo of relationsTo) {
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
                backpopulateHookFactory({
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

              const collectionAfterDeleteHooks =
                collection.hooks.afterDelete || [];

              collection.hooks.afterDelete = [
                ...collectionAfterDeleteHooks,
                backpopulateCleanupHookFactory({
                  source_field: field.name,
                  target_field: backpopulatedField.name,
                  target_slug: targetCollection.slug,
                }),
              ];
            }
          }
        }
      }
    }
  }

  return incomingConfig;
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
