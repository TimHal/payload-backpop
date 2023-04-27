import express from "express";
import { Server } from "http";
import { MongoMemoryServer } from "mongodb-memory-server";
import payload from "payload";
import { barSlug, fooSlug } from "./payload-config";
let handle: Server;

describe("Simple Config Tests", () => {
  beforeAll(async () => {
    process.env["PAYLOAD_CONFIG_PATH"] = "src/tests/simple/payload-config.ts";

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

  it("Should backpopulate a simple relationship [single add, single remove]", async () => {
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

  it("Should handle multiple active relationships [many add, many remove]", async () => {
    // Create foo1, foo2, foo3 and bar1, bar2
    let bar1 = await payload.create({
      collection: barSlug,
      data: { name: "bar1" },
    });
    let bar2 = await payload.create({
      collection: barSlug,
      data: { name: "bar2" },
    });

    let foo1 = await payload.create({
      collection: fooSlug,
      data: {
        name: "foo1",
      },
    });
    let foo2 = await payload.create({
      collection: fooSlug,
      data: {
        name: "foo2",
        bars: [bar1.id, bar2.id],
      },
    });
    let foo3 = await payload.create({
      collection: fooSlug,
      data: {
        name: "foo3",
        bars: [],
      },
    });

    // Assert that backpopulation are what we expect
    bar1 = await payload.findByID({ collection: barSlug, id: bar1.id });
    bar2 = await payload.findByID({ collection: barSlug, id: bar2.id });

    expect(bar1.foo_bars_backpopulated).toMatchObject([foo2]);
    expect(bar2.foo_bars_backpopulated).toMatchObject([foo2]);

    await payload.update({
      collection: fooSlug,
      id: foo2.id,
      data: { bars: [] },
    });

    // Assert that backpopulation are what we expect
    bar1 = await payload.findByID({ collection: barSlug, id: bar1.id });
    bar2 = await payload.findByID({ collection: barSlug, id: bar2.id });

    expect(bar1.foo_bars_backpopulated).toMatchObject([]);
    expect(bar2.foo_bars_backpopulated).toMatchObject([]);

    await payload.update({
      collection: fooSlug,
      id: foo3.id,
      data: { bars: [bar1.id, bar2.id] },
    });
    await payload.update({
      collection: fooSlug,
      id: foo1.id,
      data: { bars: [bar1.id] },
    });

    // Assert that backpopulation are what we expect
    bar1 = await payload.findByID({ collection: barSlug, id: bar1.id });
    bar2 = await payload.findByID({ collection: barSlug, id: bar2.id });
    foo1 = await payload.findByID({ collection: fooSlug, id: foo1.id });
    foo3 = await payload.findByID({ collection: fooSlug, id: foo3.id });

    expect(bar1.foo_bars_backpopulated).toMatchObject([foo3, foo1]);
    expect(bar2.foo_bars_backpopulated).toMatchObject([foo3]);
  });

  it("Should handle deletion of target elements [single add, single delete]", async () => {
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

    // Delete the foo and check again
    await payload.delete({
      collection: fooSlug,
      id: foo.id,
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
