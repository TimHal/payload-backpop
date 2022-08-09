import { Config } from "payload/config";
import { Field } from "payload/types";
import backpopulate, {
  backpopulateHookFactory,
  markerHook,
} from "./backpopulate.hook";
import payload from "payload";
import { RelationshipField } from "payload/dist/fields/config/types";

const backpopulatedRelationships = (incomingConfig: Config) => {
  for (let collection of incomingConfig.collections) {
    for (let field of collection.fields) {
        
      if (field.type === "relationship") {
        if (field.hasOwnProperty("hooks")) {
          const hasMarker = field.hooks.afterChange.find(
            (hook) => hook === markerHook
          );
          if (hasMarker) {
            // get the target collection
            // @ts-ignore es-lint-disable-line
            const targetCollection = incomingConfig.collections.find(
              (collection) => collection.slug === field.relationTo
            );
            const targetFieldName = `${collection.slug}_${field.name}_backpopulated`;
            // create a readonly hasMany relationship field on the target collection
            const backpopulatedField: Field = {
              name: targetFieldName,
              type: "relationship",
              relationTo: collection.slug,
              hasMany: true,
              access: {
                create: () => false,
                read: () => true,
                update: () => false,
              },
            };
            // prepare the target (backpopulated) collections by adding relationship fields to marked collections.
            targetCollection.fields.push(backpopulatedField);

            // replace the marker hook with the actual backpopulation hook
            // remove the marker
            field.hooks.afterChange = field.hooks.afterChange.filter(
              (hook) => hook !== markerHook
            );
            // add the backpopulate hook
            field.hooks.afterChange.push(
              backpopulateHookFactory({
                target_slug: targetCollection.slug,
                target_field: backpopulatedField.name,
              })
            );

            // the source collection also needs an afterDeleteHook to remove itself from the backpopulated fields on the target collection
            if (! collection.hasOwnProperty("hooks")) {
                collection.hooks = {};
            }
            if (! collection.hooks.hasOwnProperty("afterDelete")) {
                collection.hooks.afterDelete = [];
            }

            const collectionAfterDeleteHooks =
              collection.hooks.afterDelete || [];
            const cleanupHook = async ({ req, id, doc }) => {
              // query all documents which have a relationship to this document
              
              for (let targetId of doc[field.name]) {
                  const targetDocument = await payload.findByID({
                      collection: targetCollection.slug,
                      id: targetId,
                    });
                // get the current backrefs
                const prevReferences = targetDocument[backpopulatedField.name].map((ref) => ref.id);

                // remove self from backrefs
                await payload.update({
                  collection: targetCollection.slug,
                  id: targetId,
                  overrideAccess: true,
                  data: {
                    [backpopulatedField.name]: prevReferences.filter((id) => id && id !== doc.id)
                  },
                });
              }
            };
            collection.hooks.afterDelete = [
              ...collectionAfterDeleteHooks,
              cleanupHook,
            ];
          }
        }
      }
    }
  }

  return incomingConfig;
};

export default backpopulatedRelationships;
