import payload from "payload";
import { Field, FieldHook } from "payload/types";
import { hookArgs } from "./backpopulate";

export const backpopulateHookFactory = ({
                                          targetCollection,
                                          backpopulatedField,
                                        }: hookArgs) => {
  const hook: FieldHook = async (args) => {
    console.log("Running simple hook...")

    let { operation, originalDoc, value } = args;

    if (operation === "create" || operation === "update") {
      console.log("Create or update operation...: ", operation)
      const allTargetDocuments = await payload.find({
        collection: targetCollection.slug,
        overrideAccess: true,
        depth: 1,
      });
      console.log("targetCollection.slug: ", targetCollection.slug)

      //If the relationTo "value" is an array with length 1: Usually: Value [ '6307772a5aa9f04ab75df7d4' ] with this: [ { relationTo: 'gear-component', value: '6307772a5aa9f04ab75df7d4' } ]
      if(value && value.length >= 1 && value[0].value){
        //console.log("RelationTo is array. Current value: ", value)
        let newValue = [];
        for(const valueEntry of value){
          newValue.push(valueEntry.value);
        }
        value = newValue;
        //console.log("New value: ", value)
      }


      for (let targetDocument of allTargetDocuments.docs) { //all gear-components
        let updatedReferenceIds = [];

        console.log("Value", value);

        //console.log(targetDocument);
        if (value && (value as [string]).includes(targetDocument.id)) {
          console.log("Found targetdocument which should be backpopulated", targetDocument.id);
          // this is one of the referenced documents, we want to append ourselves to the field, but only once

          const prevReferencedIds = targetDocument[backpopulatedField["name"]].map(doc => doc.id);
          updatedReferenceIds = Array.from(
              new Set([...prevReferencedIds, originalDoc.id])
          );
        } else {
          //console.log(originalDoc);
          //console.log(targetDocument);
          // this document is not referenced (any more) make sure the originalDoc is not included in the target field
          const prevReferencedIds = targetDocument[backpopulatedField["name"]].map(doc => doc.id);
          updatedReferenceIds = prevReferencedIds.filter(
              (doc) => doc.id !== originalDoc.id
          );
        }
        await payload.update({
          collection: targetCollection.slug,
          id: targetDocument.id,
          overrideAccess: true,
          data: {
            [backpopulatedField["name"]]: updatedReferenceIds,
          },
        });
      }
    }
    return value;
  };

  return hook;
};

export default backpopulateHookFactory;