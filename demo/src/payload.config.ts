import { buildConfig } from 'payload/config';
import path from 'path';
// import Examples from './collections/Examples';
import Users from './collections/Users';
import Foo from './collections/Foo.collection';
import Bar from './collections/Bar.collection';
import BackpopulatedRelationshipsPlugin from './backpopulated-relationships.plugin';
import Baz from './collections/Baz.collection';

export default buildConfig({
  serverURL: 'http://localhost:3000',
  admin: {
    user: Users.slug,
  },
  collections: [
    Users,
    Foo,
    Bar,
    Baz,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  plugins: [
    BackpopulatedRelationshipsPlugin
  ]
});
