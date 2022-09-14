import { buildConfig } from "payload/config";
import path from "path";
import Users from "./collections/Users";
import Foo from "./collections/Foo.collection";
import Bar from "./collections/Bar.collection";
import Baz from "./collections/Baz.collection";
import BackpopulatedRelationshipsPlugin from "./backpopulated-relationship.plugin";

export default buildConfig({
  serverURL: "http://localhost:3000",
  admin: {
    user: Users.slug,
  },
  collections: [Users, Foo, Bar, Baz],
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, "generated-schema.graphql"),
  },
  plugins: [BackpopulatedRelationshipsPlugin],
});
