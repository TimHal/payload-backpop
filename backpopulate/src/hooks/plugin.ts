import { Config } from "payload/config";
import { Field } from "payload/types";
import backpopulate, {
  backpopulateHookFactory,
  marker,
  markerHook,
} from "./backpopulate.hook";
import payload from "payload";
import { RelationshipField } from "payload/dist/fields/config/types";

const backpopulatedRelationships = (incomingConfig: Config) => {
  for (let collection of incomingConfig.collections) {
    for (let field of collection.fields) {
        
      if (field.type === "relationship") {
        if (Object.hasOwn(field, "hooks")) {
          const hasMarker = field.hooks.afterChange.find(
            (hook) => hook === markerHook
          );
          console.log(markerHook);
          if (hasMarker) {
            console.log(
              `Found marker hook for ${collection.slug}.${field.name}`
            );

            // get the target collection
            // @ts-ignore es-lint-disable-line
            const targetCollection = incomingConfig.collections.find(
              (collection) => collection.slug === field.relationTo
            );
            console.log(targetCollection);
            // create a readonly hasMany relationship field on the target collection
            const backpopulatedField: Field = {
              name: `${collection.slug}_backpopulated`,
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
            if (! Object.hasOwn(collection, "hooks")) {
                collection.hooks = {};
            }
            if (! Object.hasOwn(collection.hooks, "afterDelete")) {
                collection.hooks.afterDelete = [];
            }

            const collectionAfterDeleteHooks =
              collection.hooks.afterDelete || [];
            const cleanupHook = async ({ req, id, doc }) => {
              // query all documents which have a relationship to this document
              
              console.log(doc);
              for (let targetId of doc[field.name]) {
                console.log(`cleaning target ${targetId}`);
                  const targetDocument = await payload.findByID({
                      collection: targetCollection.slug,
                      id: targetId,
                    });
                console.log(`target document`);
                console.log(targetDocument);
                // get the current backrefs
                const prevRefs = targetDocument[backpopulatedField.name];
                // remove self from backrefs
                await payload.update({
                  collection: targetCollection.slug,
                  id: targetId,
                  overrideAccess: true,
                  data: {
                    [backpopulatedField.name]: prevRefs.filter(
                      (id) => id !== doc.id
                    ),
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
