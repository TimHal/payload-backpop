import { config } from "../payload.config";
import { buildConfig } from "payload/config";
const testing_conf = {
    ... config,
    ... {
        admin: {
            disable: true,
        }
    }
}

console.log(testing_conf)

const Config = buildConfig({
    ... config,
    ... {
        admin: {
            disable: true,
        }
    }
})

export default Config