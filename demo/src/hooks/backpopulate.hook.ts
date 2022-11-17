import payload from "payload";
import { FieldHook } from "payload/types";
import { hookArgs } from "./backpopulate";

export const backpopulateAfterChangeHookFactory = ({
  //If value is added or updated from relationship?
  targetCollection,
  backpopulatedField,
  originalField,
}: hookArgs) => {
  const hook: FieldHook = async (args) => {
    const { operation, originalDoc, value, previousValue } = args;

    if (operation === "create" || operation === "update") {
      if (value === undefined || value === null) {
        // This should never happen, but better safe than sorry.
        return;
      }

      //If the relationTo "value" is an array with length 1: Usually: Value [ '6307772a5aa9f04ab75df7d4' ] with this: [ { relationTo: 'gear-component', value: '6307772a5aa9f04ab75df7d4' } ]

      const removedTargetIds = previousValue
        ? [...previousValue].filter((x) => !value.includes(x))
        : [];
      const addedTargetIds = value.filter(
        (x) => !(previousValue ?? []).includes(x)
      );

      const documentsToRemoveBackPop =
        removedTargetIds.length == 0
          ? []
          : (
              await payload.find({
                collection: targetCollection.slug,
                overrideAccess: true,
                depth: 1,
                pagination: false,
                limit: 100000,
                where: {
                  id: {
                    in: removedTargetIds,
                  },
                },
              })
            ).docs;

      const documentsToAddBackPop =
        addedTargetIds.length == 0
          ? []
          : (
              await payload.find({
                collection: targetCollection.slug,
                overrideAccess: true,
                depth: 1,
                pagination: false,
                limit: 100000,
                where: {
                  id: {
                    in: addedTargetIds,
                  },
                },
              })
            ).docs;

      for (const documentToRemoveBackPop of documentsToRemoveBackPop) {
        // this document is not referenced (any more) make sure the originalDoc is not included in the target field

        const prevReferencedIds = documentToRemoveBackPop[
          backpopulatedField["name"]
        ].map((doc) => doc.id);

        const updatedReferenceIds = prevReferencedIds.filter((doc) => {
          return (doc.id ? doc.id : doc) !== originalDoc.id; //Sometimes doc is the id, sometimes doc.id is the id
        });

        await payload.update({
          collection: targetCollection.slug,
          id: documentToRemoveBackPop.id,
          overrideAccess: true,
          data: {
            [backpopulatedField["name"]]: updatedReferenceIds,
          },
        });
      }

      for (const documentToAddBackPop of documentsToAddBackPop) {
        const prevReferencedIds = documentToAddBackPop[
          backpopulatedField["name"]
        ].map((doc) => doc.id);
        const updatedReferenceIds = Array.from(
          new Set([...prevReferencedIds, originalDoc.id])
        );
        await payload.update({
          collection: targetCollection.slug,
          id: documentToAddBackPop.id,
          overrideAccess: true,
          data: {
            [backpopulatedField["name"]]: updatedReferenceIds,
          },
        });
      }
    }

    return; //NOT return value; as the new value of that field doesn't change because of this hook anyways!!! Returning value works usually,
    // but not when the relationTo field is a simple backpopulate thingy but an ARRAY with the length of 1. Due to the previous value
    // conversion there, we cannot just return value again as the format is for non-array relationTO's now and not for array relationTo#s.
    // Thus, better to save the pain and just use a simple return;
  };

  return hook;
};
