// platform-info.json
var platform_info_default = {
  name: "@huly/platform",
  version: "1.0.0-alpha.1+20240321-sha.6b7cf44",
  description: "Huly\xAE Platform\u2122 Core",
  license: "EPL-2.0",
  author: "Hardcore Engineering, Inc <hey@huly.io> (https://huly.dev)",
  homepage: "https://huly.dev",
  contributors: [
    "Andrey Platov <andrey@hardcoreeng.com>"
  ],
  year: "2024"
};

// src/util.ts
function* iterateCompList(list) {
  if (list) {
    if (Array.isArray(list))
      for (const sink of list)
        yield sink;
    else
      yield list;
  }
}
function addCompList(list, item) {
  if (list)
    if (Array.isArray(list))
      list.push(item);
    else
      list = [list, item];
  else
    list = item;
  return list;
}
function mapObjects(values, fn) {
  const result = {};
  for (const key in values)
    result[key] = fn(values[key], key);
  return result;
}
var { year, name, version, license, homepage, author, description, contributors } = platform_info_default;
var info = { year, name, version, license, homepage, author, description, contributors };
var wrap = (std) => ({
  out: (message) => std.out(`[${name}] (stdout): ${message}`),
  err: (message) => (std.err ?? std.out)(`[${name}] (stderr): ${message}`)
});

// src/platform.ts
var createResourceType = (id) => ({ id });
var createResourceProvider = (provider) => provider;
var createLocale = (language, country) => ({ language, country });
var createPlatform = (locale, std) => {
  const { description: description2, license: license2, homepage: homepage2, version: version2, author: author2, contributors: contributors2, year: year2 } = info;
  std.out(`${description2} \u2022 ${homepage2} \u2022 SPDX: ${license2}`);
  std.out(`\xA9 ${year2} ${author2}`);
  contributors2.forEach((contributor) => std.out(`\u2022 ${contributor}`));
  std.out(`starting platform \`${version2}\`...`);
  let apis = {};
  let providers = {};
  const platform = {
    api: () => apis,
    locale,
    loadModule: (module) => {
      std.out(`initializing \`${module.id}\` module...`);
      apis = { ...apis, ...module.api };
      providers = { ...providers, ...module.resources };
      return platform;
    },
    plugin: (name2, resources) => {
      const pluginId = name2;
      const constructors = resources(mapObjects(providers, ({ factory }) => factory));
      return {
        ...mapObjects(providers, ({ type }) => mapObjects(constructors[type.id], (constructor, key) => constructor({ pluginId, type, key }, platform))),
        id: pluginId
      };
    }
  };
  return platform;
};
// src/io.ts
function pipe(...ios) {
  const first = ios[0];
  const last = ios.reduce((io, current) => io.pipe(current));
  return {
    success: first.success,
    failure: first.failure,
    pipe(sink) {
      last.pipe(sink);
      return sink;
    }
  };
}
function createIO(config) {
  function createNode(ctor, initState = State.Pending, initResult) {
    let out;
    let state = initState;
    let result = initResult;
    return ctor({
      success: (value) => {
        result = value;
        state = State.Success;
        for (const sink of iterateCompList(out))
          sink.success(result);
      },
      failure: (status) => {
        result = status;
        state = State.Failure;
        for (const sink of iterateCompList(out))
          sink.failure?.(result);
      },
      pipe: (sink) => {
        out = addCompList(out, sink);
        switch (state) {
          case State.Success:
            sink.success(result);
            break;
          case State.Failure:
            if (sink.failure)
              sink.failure(result);
            break;
        }
        return sink;
      }
    });
  }
  const syncIO = (op) => createNode((node) => ({
    pipe: node.pipe,
    success: (input) => {
      try {
        node.success(op(input, node));
      } catch (error) {
        node.failure(config.errorToStatus(error));
      }
      return node;
    },
    failure: node.failure
  }));
  const asyncIO = (op) => createNode((node) => ({
    pipe: node.pipe,
    success: (input) => {
      op(input).then(node.success, node.failure);
      return node;
    },
    failure: node.failure
  }));
  const success = (result) => createNode((node) => node, State.Success, result);
  const createResourceProvider2 = () => ({
    type: createResourceType(io),
    factory: (io) => (_) => () => io
  });
  return {
    id: io,
    api: {
      syncIO,
      asyncIO,
      success,
      pipe
    },
    resources: {
      [io]: createResourceProvider2()
    }
  };
}
var io = "io";
var State;
(function(State2) {
  State2[State2["Pending"] = 0] = "Pending";
  State2[State2["Success"] = 1] = "Success";
  State2[State2["Failure"] = 2] = "Failure";
})(State || (State = {}));

// src/status.ts
var status = "status";
var Result;
(function(Result2) {
  Result2[Result2["OK"] = 0] = "OK";
  Result2[Result2["ERROR"] = 1] = "ERROR";
})(Result || (Result = {}));
var createStatusProvider = () => ({
  type: createResourceType(status),
  factory: (result) => (id) => (params) => ({ id, result, params })
});
var createStatusPlugin = () => ({
  id: status,
  api: {},
  resources: { [status]: createStatusProvider() }
});

class PlatformError extends Error {
  status;
  constructor(status2) {
    super();
    this.status = status2;
  }
}

// src/index.ts
var platform5 = (locale, stdio) => {
  const std = wrap(stdio);
  const statusResourcesId = "platform";
  const bootStatus = createPlatform(locale, std).loadModule(createStatusPlugin());
  const statusResources = bootStatus.plugin(statusResourcesId, (_) => ({
    status: {
      UnknownError: _.status(Result.ERROR)
    }
  }));
  const io3 = {
    errorToStatus: (error) => {
      if (error instanceof PlatformError)
        return error.status;
      if (error instanceof Error)
        return statusResources.status.UnknownError({ message: error.message });
      throw error;
    },
    defaultFailureHandler: (status3) => {
      std.err(status3.toString());
    }
  };
  return bootStatus.loadModule(createIO(io3));
};
var x = platform5(createLocale("en"), { out: console.log, err: console.error });
export {
  x,
  platform5 as platform,
  createResourceType,
  createResourceProvider,
  createPlatform,
  createLocale
};
