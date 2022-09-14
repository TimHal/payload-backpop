import payload from "payload";
import { FieldHook } from "payload/types";
import { polymorphicHookArgs } from "./backpopulate";

export const backpopulatePolymorphicHookFactory = ({
  primaryCollection,
  targetCollection,
  backpopulatedField,
}: polymorphicHookArgs) => {
  const hook: FieldHook = async (args) => {
    const { operation, originalDoc, value, previousValue } = args;

    if (operation === "create" || operation === "update") {
      if (value === undefined || value === null) {
        return;
      }

      console.log("Running polymorphic hook");

      // comparing JSON representation is the easiest approach here
      const str_value = value.map(JSON.stringify);
      const str_value_prev = previousValue
        ? previousValue.map(JSON.stringify)
        : [];

      const removed_targets = [...str_value_prev]
        .filter((x) => !str_value.includes(x))
        .map((str) => JSON.parse(str));

      const added_targets = str_value
        .filter((x) => !str_value_prev.includes(x))
        .map((str) => JSON.parse(str));

      console.log("added", added_targets);
      console.log("removed", removed_targets);

      /**
       * At this point we can update the affected collections.
       * Thanks to the previousDoc this is much more efficient now.
       *
       * At first, aggregate all collections by their slugs of affected data,
       * later on we streamline the update process for simplicity.
       */

      const affected_slugs = new Set(
        [...added_targets, ...removed_targets].map((el) => el.relationTo)
      );

      // using an extra conversion to array here for compatibility
      for (const slug of Array.from(affected_slugs)) {
        // we can now get all affected documents in one go - this increases performance
        const affected_documents = (
          await payload.find({
            collection: slug,
            overrideAccess: true,
            depth: 0,
            limit: 100000,
            pagination: false,
            where: {
              id: {
                in: [...added_targets, ...removed_targets]
                  .filter((el) => el.relationTo === slug)
                  .map((el) => el.value),
              },
            },
          })
        ).docs;

        // reduce the added_items to their ids, then check against those and remove the document from all other affected_documents
        // just a minor performance improvement but it saves one extra step
        const added_target_ids = added_targets
          .filter((el) => el.relationTo === slug)
          .map((el) => el.value);
        for (const affected_document of affected_documents) {
          const references = affected_document[backpopulatedField["name"]];
          let updated_references = [];
          if (added_target_ids.includes(affected_document.id)) {
            updated_references = Array.from(
              new Set([...references, originalDoc.id])
            );
          } else {
            updated_references = references.filter(
              (el) => el !== originalDoc.id
            );
          }

          // finally, update the affected document
          await payload.update({
            collection: slug,
            id: affected_document.id,
            overrideAccess: true,
            data: {
              [backpopulatedField["name"]]: updated_references,
            },
            depth: 0,
          });
        }
      }
    }
    return;
  };

  return hook;
};

export default backpopulatePolymorphicHookFactory;
