import express from "express";
import { Server } from "http";
import { MongoMemoryServer } from "mongodb-memory-server";
import payload from "payload";
import { barSlug, fooSlug } from "./configs/simple/payload-config";
let handle: Server;

describe("Simple Config Tests", () => {
  beforeAll(async () => {
    process.env["PAYLOAD_CONFIG_PATH"] =
      "src/tests/configs/simple/payload-config.ts";

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

  it("Should backpopulate a simple relationship [single add, single delete]", async () => {
    // Create basic entities
    let foo = await payload.create({
      collection: fooSlug,
      data: {
        name: "foo",
        bars: [],
      },
    });

    let bar = await payload.create({
      collection: barSlug,
      data: {
        name: "bar",
      },
    });

    // Now connect foo and bar, bar should backpopulate the relationship
    foo = await payload.update({
      collection: fooSlug,
      id: foo.id,
      data: {
        bars: [bar.id],
      },
    });

    bar = await payload.findByID({
      collection: barSlug,
      id: bar.id,
    });

    expect(bar).toMatchObject({
      name: bar.name,
      foo_bars_backpopulated: [foo],
    });

    // Remove the bar and check again
    foo = await payload.update({
      collection: fooSlug,
      id: foo.id,
      data: {
        bars: [],
      },
    });

    bar = await payload.findByID({
      collection: barSlug,
      id: bar.id,
    });

    expect(bar).toMatchObject({
      name: bar.name,
      foo_bars_backpopulated: [],
    });
  });
});
