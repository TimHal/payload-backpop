import express from "express";
import { Server } from "http";
import { MongoMemoryServer } from "mongodb-memory-server";
import payload from "payload";
let handle: Server;
/**
 * Just a placeholder.
 * This suite will test the plugin specific config and options.
 */

describe("AutoI18n Plugin Tests", () => {
  // beforeAll(async () => {
  //   process.env["PAYLOAD_CONFIG_PATH"] =
  //     "src/tests/configs/simple/payload-config.ts";

  //   const mongod = await MongoMemoryServer.create();
  //   const uri = mongod.getUri();
  //   const app = express();
  //   handle = app.listen(3000);

  //   await payload.init({
  //     secret: "SECRET",
  //     express: app,
  //     mongoURL: uri,
  //   });
  // });

  // afterAll(() => {
  //   handle.close();
  // });

  it("Noop", async () => {
    expect(1).toBe(1);
  });
});
