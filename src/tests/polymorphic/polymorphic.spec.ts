import express from "express";
import { Server } from "http";
import { MongoMemoryServer } from "mongodb-memory-server";
import payload from "payload";
import { barSlug, fooSlug } from "./payload-config";
let handle: Server;

describe("Polymorphic Config Tests", () => {
  beforeAll(async () => {
    process.env["PAYLOAD_CONFIG_PATH"] =
      "src/tests/polymorphic/payload-config.ts";

    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const app = express();
    handle = app.listen(3000);

    await payload.init({
      secret: "SECRET",
      express: app,
      mongoURL: uri,
    });
  });

  afterAll(() => {
    handle.close();
  });

  it("Should backpopulate a polymorphic relationship [single add, single remove]", async () => {
    // Create basic entities
    let foo = await payload.create({
      collection: fooSlug,
      data: {
        name: "foo",
        bars_or_bazzes: [],
      },
    });

    let bar = await payload.create({
      collection: barSlug,
      data: {
        name: "bar",
      },
    });

    console.log(bar);

    // Now connect foo and bar, bar should backpopulate the relationship
    foo = await payload.update({
      collection: fooSlug,
      id: foo.id,
      data: {
        bars_or_bazzes: [{ relationTo: barSlug, value: bar.id }],
      },
    });

    bar = await payload.findByID({
      collection: barSlug,
      id: bar.id,
    });

    console.log(bar);
    expect(bar).toMatchObject({
      name: bar.name,
      foo_bars_or_bazzes_backpopulated: [foo],
    });

    // Remove the bar and check again
    foo = await payload.update({
      collection: fooSlug,
      id: foo.id,
      data: {
        bars_or_bazzes: [],
      },
    });

    bar = await payload.findByID({
      collection: barSlug,
      id: bar.id,
    });

    expect(bar).toMatchObject({
      name: bar.name,
      foo_bars_or_bazzes_backpopulated: [],
    });
  });
});
