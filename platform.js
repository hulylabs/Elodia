// packages/platform/src/util.ts
function mapObjects(values, fn) {
  const result = {};
  for (const key in values)
    result[key] = fn(values[key], key);
  return result;
}

// packages/platform/src/index.ts
var createResourceType = (id) => ({ id });
var createPlatform = () => {
  let apis = {};
  let providers = {};
  const platform = {
    loadModule: (module) => {
      apis = { ...apis, ...module.api() };
      return platform;
    },
    addResourceProvider: (resourceProvider) => {
      providers = { ...providers, [resourceProvider.type.id]: resourceProvider };
      return platform;
    },
    createResource: (pluginId, resources) => {
      const constructors = resources(mapObjects(providers, ({ factory }) => factory));
      return {
        ...mapObjects(providers, ({ type }) => mapObjects(constructors[type.id], (constructor, key) => constructor({ pluginId, type, key }))),
        id: pluginId
      };
    }
  };
  return platform;
};
var Result;
(function(Result2) {
  Result2[Result2["OK"] = 0] = "OK";
  Result2[Result2["ERROR"] = 1] = "ERROR";
})(Result || (Result = {}));
var statusProvider = {
  type: createResourceType("status"),
  factory: (result) => (id) => (params) => ({ id, result, params })
};

class PlatformError extends Error {
  status;
  constructor(status) {
    super();
    this.status = status;
  }
}
export {
  statusProvider,
  createResourceType,
  createPlatform,
  Result,
  PlatformError
};
