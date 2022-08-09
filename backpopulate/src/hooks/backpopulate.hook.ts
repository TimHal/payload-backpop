import { Field, FieldHook } from "payload/types";
import payload from 'payload';

interface hookArgs {
    target_slug: string;
    target_field: string;
}

export const marker = () => {
    // return makerHook.bind(hookArgs);
    return markerHook;
}

export const markerHook: FieldHook = (args) => {
    return args.value;
}

export const backpopulateHookFactory = ({ target_slug, target_field }: hookArgs) => {
    const hook: FieldHook = async (args) => {
        const {
           data,
           operation, 
           originalDoc, 
           value 
        } = args;
        
        if (operation === 'create' || operation === 'update') {
            // check if the target collection has a relationship field to self, otherwise create it

            const allTargetDocuments = await payload.find({
                collection: target_slug,
                overrideAccess: true,
                depth: 1
            });

            for (let targetDocument of allTargetDocuments.docs) {
                let updatedReferenceIds;
                if ((value as [string]).includes(targetDocument.id)) {
                    // this is one of the referenced documents, we want to append ourselves to the field, but only once
                    const prevReferencedIds = targetDocument[target_field].map((doc) => doc.id);
                    updatedReferenceIds = Array.from(new Set([...prevReferencedIds, originalDoc.id]));
                    
                } else {
                    // this document is not referenced (any more) make sure the originalDoc is not included in the target field
                    const prevReferencedIds = targetDocument[target_field].map((doc) => doc.id);
                    updatedReferenceIds = Array.from(new Set(prevReferencedIds)).filter(id => id && id !== originalDoc.id);
                }
                await payload.update({
                    collection: target_slug,
                    id: targetDocument.id,
                    overrideAccess: true,
                    data: {
                        [target_field]: updatedReferenceIds
                    }
                })
            }
        }
    
        return value;
    }

    return hook;   
}

const backpopulate = (hookArgs) => {
    console.log(hookArgs);
    const hook: FieldHook = async (args) => {
        const {
           data,
           operation, 
           originalDoc, 
           value 
        } = args;
        
        if (operation === 'create' || operation === 'update') {
            // check if the target collection has a relationship field to self, otherwise create it

            // add self to backpopulated relationship
            console.log(data);
            console.log(`Created new relationship ${data} \n ${value}`);
            console.log(originalDoc);

        }
    
        // TODO: add a cleanup hook on document level

        if (operation === 'delete') {
            console.log(`Removed relationship ${data} \n ${value}`);
        }

        return value;
    }

    // make sure the document gets updated with the new field


    return hook;
}

export default backpopulate;