import { CollectionConfig, Field, FieldHook } from "payload/types";



const backpopulate: FieldHook = (args) => {
  /**
   * This is just a marker hook and will be replaced by the plugin.
   * Using this marker hook allows to simply use 'backpopulate' as a hook name in the config.
   */
  return args.value;
};

export default backpopulate;
