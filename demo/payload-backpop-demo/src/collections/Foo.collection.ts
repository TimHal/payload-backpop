import { CollectionConfig } from "payload/types";
import backpopulate from "../hooks/backpopulate";


const Foo: CollectionConfig = {
    slug: 'foo',
    admin: {
        useAsTitle: 'name',
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'bars',
            type: 'relationship',
            relationTo: 'bar',
            hasMany: true,
            hooks: {
                afterChange: [backpopulate],
            }
        },
        {
            name: 'bars_or_bazzes',
            type: 'relationship',
            relationTo: ['bar', 'baz'],
            hasMany: true,
            hooks: {
                afterChange: [backpopulate],
            }
        }
    ]

}

export default Foo;