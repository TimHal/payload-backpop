import { buildConfig } from "payload/config";
import * as BackpopulatePlugin from "../../index";
import backpopulate from "../../hooks/backpopulate";

export const fooSlug: string = "foo";
export const barSlug: string = "bar";
export const bazSlug: string = "baz";

/**
 * A simple collection where all translatable fields are top-level.
 * For this reason it is considered `simple` (no field unrolling required)
 */
export default buildConfig({
  admin: {
    disable: true,
  },

  debug: true,
  telemetry: false,

  collections: [
    {
      slug: fooSlug,
      timestamps: false,
      fields: [
        {
          name: "name",
          type: "text",
        },
        {
          name: "bars",
          type: "relationship",
          relationTo: barSlug,
          hooks: {
            afterChange: [backpopulate],
          },
        },
        {
          name: "bars_or_bazzes",
          type: "relationship",
          relationTo: [barSlug, bazSlug],
          hooks: {
            afterChange: [backpopulate],
          },
        },
      ],
    },
    {
      slug: barSlug,
      timestamps: false,
      fields: [
        {
          name: "name",
          type: "text",
        },
      ],
    },
    {
      slug: bazSlug,
      timestamps: false,
      fields: [
        {
          name: "name",
          type: "text",
        },
      ],
    },
  ],

  plugins: [BackpopulatePlugin.default],
});
