import payload from "payload";
import { buildConfig } from "payload/config";
import { config } from "../payload.config";

const globalSetup = async (): Promise<void> => {
  const testing_config = {
    ...config,
    ...{
      admin: {
        disable: true,
      },
    },
  };

  const build_config = buildConfig(testing_config);
  process.env.PAYLOAD_CONFIG_PATH;
  await payload.initAsync({
    mongoURL: "mongodb://localhost/pcms-plugin-tests",
    secret: "pcms-plugin",
    local: true,
  });
};

export default globalSetup;
