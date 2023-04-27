import payload from "payload";
import { AfterDeleteHook } from "payload/dist/collections/config/types";
import { FieldHook, PayloadRequest } from "payload/types";

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
  const cleanupHook = async ({ doc }: { doc: any }) => {
    // query all documents which have a relationship to this document
    let value = doc[source_field] ? doc[source_field] : [];

    if (!Array.isArray(value)) {
      value = [value];
    }

    if (value && value.length >= 1 && value[0].value) {
      let newValue = [];
      for (const valueEntry of value) {
        newValue.push(valueEntry.value);
      }
      value = newValue;
    }

    for (let targetId of value) {
      const targetDocument = await payload.findByID({
        collection: target_slug,
        id: targetId,
      });
      if (!targetDocument) {
        continue;
      }
      // get the current backrefs
      const prevReferences = targetDocument[target_field].map(
        (ref: any) => ref.id
      );

      // remove self from backrefs
      await payload.update({
        collection: target_slug,
        id: targetId,
        overrideAccess: true,
        data: {
          [target_field]: prevReferences.filter(
            (id: string) => id && id !== doc.id
          ),
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
  const cleanupHook = async ({
    req: id,
    doc,
  }: {
    req: PayloadRequest<any>;
    id: string | number;
    doc: any;
  }) => {
    // query all documents which have a relationship to this document
    let value = doc[source_field] ? doc[source_field] : [];
    if (value && value.length >= 1 && value[0].value) {
      let newValue = [];
      for (const valueEntry of value) {
        newValue.push(valueEntry.value);
      }
      value = newValue;
    }

    for (let targetId of value) {
      const targetDocument = await payload.findByID({
        collection: target_slug,
        id: targetId,
      });
      if (!targetDocument) {
        continue;
      }

      // get the current backrefs
      const prevReferences = targetDocument[target_field].map((ref: any) =>
        ref.id ? ref.id : ref.value.id ? ref.value.id : ref.value
      );

      let updatedReferenceIds = [];
      updatedReferenceIds = prevReferences.filter((ref: any) => {
        return (ref.id ? ref.id : ref) !== id; //Sometimes doc is the id, sometimes doc.id is the id
      });

      // remove self from backrefs
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
