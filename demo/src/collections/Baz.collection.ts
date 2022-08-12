import { CollectionConfig } from "payload/types";

const Baz: CollectionConfig = {
    slug: 'baz',
    admin: {
        useAsTitle: 'name',
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        
    ]

}

export default Baz;