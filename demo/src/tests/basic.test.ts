
import { MongoMemoryServer } from "mongodb-memory-server";
import payload from "payload";
import Bar from "../collections/Bar.collection";
import Foo from "../collections/Foo.collection";

describe("basic tests", () => {

  beforeAll(async () => {
    const mongo = await MongoMemoryServer.create();
    
    payload.init({ 
        mongoURL: mongo.getUri(),
        secret: 'pcms-test',
        local: true,    
    })
  })

  test("Simple Relationships", async () => {

    // set up instances of foos and bars 
    const foo_1 = await payload.create({
      collection: Foo.slug,
      data: {name: 'Foo 1'}
    })
    const foo_2 = await payload.create({
      collection: Foo.slug,
      data: {name: 'Foo 2'}
    })

    const bar_1 = await payload.create({
      collection: Bar.slug,
      data: {name: 'Bar 1'}
    })
    const bar_2 = await payload.create({
      collection: Bar.slug,
      data: {name: 'Bar 2'}
    })

    console.log(foo_1)
    console.log(bar_1)
    // link foo_1 to bar_1 using the original relationship
    
    await payload.update({
      collection: Foo.slug,
      id: foo_1.id,
      data: {
        bars: [bar_1.id]
      }
    })

    expect((await payload.findByID({
      collection: Foo.slug,
      id: foo_1
    })).doc.bars.length).toBe(1)
    expect((await payload.findByID({
      collection: Bar.slug,
      id: bar_1
    })).doc.foo_bars_backpopulated.length).toBe(1)
    

    expect(1).toBe(1)

  })

});
