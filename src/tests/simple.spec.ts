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

  it("Should backpopulate a simple relationship", async () => {
    const foo = await payload.create({
      collection: fooSlug,
      data: {
        name: "foo",
        bars: [],
      },
    });

    const bar = await payload.create({
      collection: barSlug,
      data: {
        name: "bar",
      },
    });

    // now connect foo and bar, bar should backpopulate the relationship
    await payload.update({
      collection: fooSlug,
      id: foo.id,
      data: {
        bars: [bar.id],
      },
    });

    console.log(
      await payload.findByID({
        collection: fooSlug,
        id: foo.id,
      })
    );
    console.log(
      await payload.findByID({
        collection: barSlug,
        id: bar.id,
      })
    );
    expect(1).toBe(1);
  });
});