import payload from "payload";
import { config } from "../payload.config";

const setupPayload = () => {

    process.env['NODE_ENV'] = 'test';

    payload.init({ 
        mongoURL: false,
        secret: 'pcms-test',
        local: true,    
        onInit: (instance) => {
            console.log(instance.collections)
        }   
    })

}

export default setupPayload