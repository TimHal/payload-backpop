
import { MongoMemoryServer } from "mongodb-memory-server";
import payload from "payload";
import Bar from "../collections/Bar.collection";

describe("basic tests", () => {

  beforeAll(async () => {
    const mongo = await MongoMemoryServer.create();
    
    payload.init({ 
        mongoURL: mongo.getUri(),
        secret: 'pcms-test',
        local: true,    
    })
  })

  test("Create", async () => {
    const prev_bars = await payload.find({
      collection: Bar.slug,
      overrideAccess: true,
      depth: 1,
    });

    console.log(prev_bars.docs);

    // insert one
    await payload.create({
      collection: Bar.slug,
      data: {
        name: "bar 1",
      },
    });
    const new_bars = await payload.find({
      collection: Bar.slug,
      overrideAccess: true,
    });

    console.log(new_bars.docs);

    expect(new_bars.totalDocs).toBe(1);
  });
});
