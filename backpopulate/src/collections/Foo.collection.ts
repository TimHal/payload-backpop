import { CollectionConfig } from "payload/types";
import backpopulate, { markerHook, marker } from "../hooks/backpopulate.hook";

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
                // afterChange: [backpopulate({ target_slug: 'bar', target_field: 'foos' })],
                afterChange: [markerHook],
            }
        }
    ]

}

export default Foo;