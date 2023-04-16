import payload from "payload";
import { AfterDeleteHook } from "payload/dist/collections/config/types";
import { FieldHook } from "payload/types";

export interface BackpopulateCleanupHookArgs {
  source_field: string;
  target_slug: string;
  target_field: string;
}

//When the parent field is deleted
export const backpopulatePolymorphicCleanupHookFactory = ({
  source_field,
  target_field,
  target_slug,
}: BackpopulateCleanupHookArgs): AfterDeleteHook => {
  const cleanupHook = async ({ req, id, doc }) => {
    // query all documents which have a relationship to this document
    let value = doc[source_field] ?? [];

    const affected_slugs: string[] = Array.from(
      new Set(value.map((el) => el.relationTo))
    );

    for (const slug of affected_slugs) {
      for (const affected_document_id of value
        .filter((el) => el.relationTo === slug)
        .map((el) => el.value)) {
        // we hold a reference to these documents, just remove our own id and we're good
        // we still need to query the documents in order to retain all other back references
        const affected_doc = await payload.findByID({
          collection: slug,
          id: affected_document_id,
          overrideAccess: true,
          depth: 0,
        });

        const prev_references = affected_doc[target_field];

        await payload.update({
          collection: slug,
          id: affected_document_id,
          data: {
            [target_field]: prev_references.filter((el) => el !== doc.id),
          },
          overrideAccess: true,
          depth: 0,
        });
      }
    }
  };

  return cleanupHook;
};
