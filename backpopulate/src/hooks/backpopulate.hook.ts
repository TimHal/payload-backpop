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

            // add self to backpopulated relationship
            console.log(data);
            console.log(originalDoc);
            console.log(value);

            for(let id of value) {
                console.log(target_field);
                const targetDoc = await payload.findByID({
                    collection: target_slug,
                    id: id,
                })
                console.log('prev_refs');
                console.log(targetDoc[target_field]);

                const res = await payload.update({
                    collection: target_slug,
                    id: id,
                    overrideAccess: true,
                    data: {
                        [target_field]: [...targetDoc[target_field], originalDoc.id]
                    }
                });
                console.log(res);
                console.log(res[target_field]);
            }
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