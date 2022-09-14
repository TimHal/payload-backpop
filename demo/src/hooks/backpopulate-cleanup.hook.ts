import payload from "payload";
import { AfterDeleteHook } from "payload/dist/collections/config/types";
import { FieldHook } from "payload/types";

export interface BackpopulateCleanupHookArgs {
  source_field: string;
  target_slug: string;
  target_field: string;
}

//When the parent field is deleted
export const backpopulateCleanupHookFactory = ({
  source_field,
  target_field,
  target_slug,
}: BackpopulateCleanupHookArgs): AfterDeleteHook => {
  const cleanupHook = async ({ req, id, doc }) => {
    // query all documents which have a relationship to this document
    console.log("backpopulateCleanupHookFactory hook");
    let value = doc[source_field] ? doc[source_field] : [];
    if (value && value.length >= 1 && value[0].value) {
      let newValue = [];
      for (const valueEntry of value) {
        newValue.push(valueEntry.value);
      }
      value = newValue;
    }
    console.log("value", value);

    for (let targetId of value) {
      const targetDocument = await payload.findByID({
        collection: target_slug,
        id: targetId,
      });
      if (!targetDocument) {
        continue;
      }
      console.log("Found target document: ", targetDocument);

      // get the current backrefs
      const prevReferences = targetDocument[target_field].map((ref) => ref.id);

      // remove self from backrefs
      await payload.update({
        collection: target_slug,
        id: targetId,
        overrideAccess: true,
        data: {
          [target_field]: prevReferences.filter((id) => id && id !== doc.id),
        },
      });
    }
  };

  return cleanupHook;
};

//When the backpopulated field is deleted
export const parentCleanupHookFactory = ({
  source_field,
  target_field,
  target_slug,
}: BackpopulateCleanupHookArgs): AfterDeleteHook => {
  const cleanupHook = async ({ req, id, doc }) => {
    // query all documents which have a relationship to this document
    console.log("backpopulateCleanupHookFactory hook");
    let value = doc[source_field] ? doc[source_field] : [];
    if (value && value.length >= 1 && value[0].value) {
      let newValue = [];
      for (const valueEntry of value) {
        newValue.push(valueEntry.value);
      }
      value = newValue;
    }
    console.log("value", value);
    console.log("id", id);

    for (let targetId of value) {
      const targetDocument = await payload.findByID({
        collection: target_slug,
        id: targetId,
      });
      if (!targetDocument) {
        continue;
      }
      console.log(
        "Found targetDocument[target_field]: ",
        targetDocument[target_field]
      );

      // get the current backrefs
      const prevReferences = targetDocument[target_field].map((ref) =>
        ref.id ? ref.id : ref.value.id ? ref.value.id : ref.value
      );

      console.log("prevReferences", prevReferences);

      let updatedReferenceIds = [];
      updatedReferenceIds = prevReferences.filter((ref) => {
        console.log("REF", ref.id ? ref.id : ref);
        console.log("id", id);

        return (ref.id ? ref.id : ref) !== id; //Sometimes doc is the id, sometimes doc.id is the id
      });

      console.log("updatedReferenceIds", updatedReferenceIds);

      // remove self from backrefs
      console.log("Target field", target_field);
      await payload.update({
        collection: target_slug,
        id: targetId,
        overrideAccess: true,
        data: {
          [target_field]: updatedReferenceIds, //TODO: Doesnt work. Not properly removed from parent relaitonship yet (esp if parents field is array-like relaitonship, non-poly of course)
        },
      });
    }
  };

  return cleanupHook;
};
