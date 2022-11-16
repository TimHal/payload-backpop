import { MongoMemoryServer } from "mongodb-memory-server";
import payload from "payload";
import Bar from "../collections/Bar.collection";
import Baz from "../collections/Baz.collection";
import Foo from "../collections/Foo.collection";

describe("basic tests", () => {
  beforeAll(async () => {
    const mongo = await MongoMemoryServer.create();

    payload.init({
      mongoURL: mongo.getUri(),
      secret: "pcms-test",
      local: true,
    });
  });

  test("Simple Relationships", async () => {
    // set up instances of foos and bars
    const foo_1 = await payload.create({
      collection: Foo.slug,
      data: { name: "Foo 1" },
    });
    const foo_2 = await payload.create({
      collection: Foo.slug,
      data: { name: "Foo 2" },
    });

    const bar_1 = await payload.create({
      collection: Bar.slug,
      data: { name: "Bar 1" },
    });
    const bar_2 = await payload.create({
      collection: Bar.slug,
      data: { name: "Bar 2" },
    });

    await payload.update({
      collection: Foo.slug,
      id: foo_1.id,
      data: {
        bars: [bar_1.id],
      },
    });

    expect(
      (
        await payload.findByID({
          collection: Foo.slug,
          id: foo_1.id,
        })
      ).bars.length
    ).toBe(1);
    expect(
      (
        await payload.findByID({
          collection: Bar.slug,
          id: bar_1.id,
        })
      ).foo_bars_backpopulated.length
    ).toBe(1);

    // append the bar 2 to foo, should now have 2 references and 1+1 backreferences
    await payload.update({
      collection: Foo.slug,
      id: foo_1.id,
      data: {
        bars: [bar_1.id, bar_2.id],
      },
    });

    expect(
      (
        await payload.findByID({
          collection: Foo.slug,
          id: foo_1.id,
        })
      ).bars.length
    ).toBe(2);
    expect(
      (
        await payload.findByID({
          collection: Bar.slug,
          id: bar_2.id,
        })
      ).foo_bars_backpopulated.length
    ).toBe(1);

    // remove bar_1 and check if the updates are correct
    // removal is done by update with the same n-1 entries
    await payload.update({
      collection: Foo.slug,
      id: foo_1.id,
      data: {
        bars: [bar_2.id],
      },
    });

    expect(
      (
        await payload.findByID({
          collection: Bar.slug,
          id: bar_2.id,
        })
      ).foo_bars_backpopulated.length
    ).toBe(1);
    expect(
      (
        await payload.findByID({
          collection: Bar.slug,
          id: bar_1.id,
        })
      ).foo_bars_backpopulated.length
    ).toBe(0);
  });

  test("Polymorphic Relationships", async () => {
    // set up instances of foos and bazzes
    const foo_1 = await payload.create({
      collection: Foo.slug,
      data: { name: "Foo 1" },
    });
    const foo_2 = await payload.create({
      collection: Foo.slug,
      data: { name: "Foo 2" },
    });

    const baz_1 = await payload.create({
      collection: Baz.slug,
      data: { name: "Baz 1" },
    });
    const baz_2 = await payload.create({
      collection: Baz.slug,
      data: { name: "Baz 2" },
    });

    console.log(foo_1);
    console.log(baz_1);

    await payload.update({
      collection: Foo.slug,
      id: foo_1.id,
      data: {
        bars_or_bazzes: [{ value: baz_1.id, relationTo: Baz.slug }],
      },
    });

    expect(
      (
        await payload.findByID({
          collection: Foo.slug,
          id: foo_1.id,
        })
      ).bars_or_bazzes.length
    ).toBe(1);
    expect(
      (
        await payload.findByID({
          collection: Baz.slug,
          id: baz_1.id,
        })
      ).foo_bars_or_bazzes_backpopulated.length
    ).toBe(1);

    // append the baz 2 to foo, should now have 2 references and 1+1 backreferences
    await payload.update({
      collection: Foo.slug,
      id: foo_1.id,
      data: {
        bars_or_bazzes: [
          { value: baz_1.id, relationTo: Baz.slug },
          { value: baz_2.id, relationTo: Baz.slug },
        ],
      },
    });

    expect(
      (
        await payload.findByID({
          collection: Foo.slug,
          id: foo_1.id,
        })
      ).bars_or_bazzes.length
    ).toBe(2);
    expect(
      (
        await payload.findByID({
          collection: Baz.slug,
          id: baz_2.id,
        })
      ).foo_bars_or_bazzes_backpopulated.length
    ).toBe(1);
  });
});
