import { CollectionConfig } from "payload/types";

const Bar: CollectionConfig = {
    slug: 'bar',
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

export default Bar;