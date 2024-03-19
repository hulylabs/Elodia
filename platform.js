// packages/platform/src/util.ts
function mapObjects(values, fn) {
  const result = {};
  for (const key in values)
    result[key] = fn(values[key], key);
  return result;
}

// packages/platform/src/resource.ts
var createResources = (providers, pluginId, pluginConstructors) => providers.reduce((acc, { type }) => acc[type.id] = mapObjects(pluginConstructors[type.id], (constructor, key) => constructor({ pluginId, type, key })), {});
var createPlatform = (providers) => {
  const helper = Object.fromEntries(providers.map((provider) => [provider.type.id, provider.factory]));
  return {
    plugin: (name, template) => ({
      ...createResources(providers, name, template(helper)),
      id: name
    })
  };
};
export {
  createPlatform
};
