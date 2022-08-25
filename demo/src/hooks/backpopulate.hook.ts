import payload from "payload";
import {Field, FieldHook} from "payload/types";
import {hookArgs} from "./backpopulate";

export const backpopulateAfterChangeHookFactory = ({ //If value is added or updated from relationship?
                                                       targetCollection,
                                                       backpopulatedField,
                                                       originalField,
                                                   }: hookArgs) => {
    const hook: FieldHook = async (args) => {
        console.log("Running simple hook...")

        let {operation, originalDoc, value, previousValue} = args;
        console.log("After change value", value)
        console.log("After change previousValue", previousValue)


        if (operation === "create" || operation === "update") {
            console.log("Create or update operation...: ", operation)

            //If the relationTo "value" is an array with length 1: Usually: Value [ '6307772a5aa9f04ab75df7d4' ] with this: [ { relationTo: 'gear-component', value: '6307772a5aa9f04ab75df7d4' } ]
            if (value && value.length >= 1 && value[0].value) {
                let newValue = [];
                for (const valueEntry of value) {
                    newValue.push(valueEntry.value);
                }
                value = newValue;
            }
            if (previousValue && previousValue.length >= 1 && previousValue[0].value) {
                let newValue = [];
                for (const valueEntry of previousValue) {
                    newValue.push(valueEntry.value);
                }
                previousValue = newValue;
            }

            let removedTargetIds: string[] = [];
            let addedTargetIds: string[] = [];
            //Get removed IDs
            if(previousValue){
                for(const previousValueEntry of previousValue){
                    if(!value.includes(previousValueEntry)){
                        removedTargetIds.push(previousValueEntry);
                    }
                }
            }

            //Get added IDs
            if(value){
                for(const newValueEntry of value){
                    if(!previousValue.includes(newValueEntry)){
                        addedTargetIds.push(newValueEntry);
                    }
                }
            }


            console.log("Added target IDs: ", addedTargetIds)
            console.log("Removed target IDs: ", removedTargetIds)

            const documentsToRemoveBackPop = removedTargetIds.length==0 ? [] : (await payload.find({
                collection: targetCollection.slug,
                overrideAccess: true,
                depth: 1,
                pagination: false,
                limit: 100000,
                where: {
                    id: {
                        in: removedTargetIds,
                    }
                }
            })).docs;
            console.log("documentsToRemoveBackPop: ", documentsToRemoveBackPop)

            const documentsToAddBackPop = addedTargetIds.length==0 ? [] : (await payload.find({
                collection: targetCollection.slug,
                overrideAccess: true,
                depth: 1,
                pagination: false,
                limit: 100000,
                where: {
                    id: {
                        in: addedTargetIds,
                    }
                }
            })).docs;
            console.log("documentsToAddBackPop: ", documentsToAddBackPop)


            for (let documentToRemoveBackPop of documentsToRemoveBackPop) {
                let updatedReferenceIds = [];

                // this document is not referenced (any more) make sure the originalDoc is not included in the target field
                console.log("Found targetdocument whose backpoulation should be removed", documentToRemoveBackPop.id);

                const prevReferencedIds = documentToRemoveBackPop[backpopulatedField["name"]].map(doc => doc.id);

                updatedReferenceIds = prevReferencedIds.filter(
                    (doc) => {
                        return (doc.id ? doc.id : doc) !== originalDoc.id //Sometimes doc is the id, sometimes doc.id is the id
                    }
                );

                await payload.update({
                    collection: targetCollection.slug,
                    id: documentToRemoveBackPop.id,
                    overrideAccess: true,
                    data: {
                        [backpopulatedField["name"]]: updatedReferenceIds,
                    },
                });
            }


            for (let documentToAddBackPop of documentsToAddBackPop) {
                let updatedReferenceIds = [];

                console.log("Found targetdocument which should be backpopulated", documentToAddBackPop.id);
                // this is one of the referenced documents, we want to append ourselves to the field, but only once

                const prevReferencedIds = documentToAddBackPop[backpopulatedField["name"]].map(doc => doc.id);
                updatedReferenceIds = Array.from(
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
