// packages/platform/src/util.ts
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

// packages/platform/src/index.ts
var createPlatform = () => {
  let apis = {};
  let providers = {};
  const platform = {
    loadModule: (module) => {
      apis = { ...apis, ...module.api };
      providers = { ...providers, ...module.resources };
      return platform;
    },
    plugin: (name, resources) => {
      const pluginId = name;
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
class PlatformError extends Error {
  status;
  constructor(status) {
    super();
    this.status = status;
  }
}

// packages/platform/src/modules/io.ts
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
  return {
    api: {
      syncIO,
      asyncIO,
      success,
      pipe
    },
    resources: {}
  };
}
var State;
(function(State2) {
  State2[State2["Pending"] = 0] = "Pending";
  State2[State2["Success"] = 1] = "Success";
  State2[State2["Failure"] = 2] = "Failure";
})(State || (State = {}));

// packages/platform/src/example.ts
var configuration = {
  errorToStatus: (error) => {
    if (error instanceof PlatformError)
      return error.status;
    if (error instanceof Error)
      return {
        id: "platform.status.UnknownError",
        result: Result.ERROR,
        params: { message: error.message }
      };
    throw error;
  },
  defaultFailureHandler: (status) => {
    console.error("unhandled status: ", status);
  }
};
var platform = createPlatform().loadModule(createIO(configuration));
export {
  platform,
  configuration
};
