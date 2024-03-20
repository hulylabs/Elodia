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

// packages/platform/src/modules/io.ts
function createIO(config) {
  class SyncIO extends IOBase {
    op;
    constructor(op) {
      super();
      this.op = op;
    }
    success(input) {
      try {
        this.setResult(this.op(input, this));
      } catch (error) {
        this.setStatus(config.errorToStatus(error));
      }
      return this;
    }
    [Symbol.iterator]() {
      throw new Error("Method not implemented.");
    }
  }

  class AsyncIO extends IOBase {
    op;
    constructor(op) {
      super();
      this.op = op;
    }
    success(input) {
      this.op(input).then(this.setResult.bind(this), this.setStatus.bind(this));
      return this;
    }
  }
  return {
    syncIO: (op) => new SyncIO(op),
    asyncIO: (op) => new AsyncIO(op)
  };
}
var State;
(function(State2) {
  State2[State2["Pending"] = 0] = "Pending";
  State2[State2["Success"] = 1] = "Success";
  State2[State2["Failure"] = 2] = "Failure";
})(State || (State = {}));

class IODiagnostic {
  static sequence = 0;
  id = `io-${(IODiagnostic.sequence++).toString(32)}`;
}

class IOBase extends IODiagnostic {
  constructor() {
    super(...arguments);
  }
  out;
  state = State.Pending;
  result;
  setResult(result) {
    this.result = result;
    this.state = State.Success;
    for (const sink of iterateCompList(this.out))
      sink.success(this.result);
  }
  setStatus(status) {
    this.result = status;
    this.state = State.Failure;
    for (const sink of iterateCompList(this.out))
      sink.failure?.(this.result);
  }
  pipe(sink) {
    this.out = addCompList(this.out, sink);
    switch (this.state) {
      case State.Success:
        sink.success(this.result);
        break;
      case State.Failure:
        if (sink.failure)
          sink.failure(this.result);
        break;
    }
    return sink;
  }
  failure(status) {
    this.setStatus(status);
  }
  printDiagnostic(level = 0) {
    const indent = "  ".repeat(level) + " \xB7";
    console.log(`${indent} IO: ${this.id} (${this.state})`);
    for (const sink of iterateCompList(this.out)) {
      sink.printDiagnostic(level + 1);
    }
  }
}

// packages/platform/src/modules/resource.ts
var createResourceType = (id) => ({ id });
var createPluginResources = (providers, pluginId, pluginConstructors) => providers.reduce((acc, { type }) => {
  acc[type.id] = mapObjects(pluginConstructors[type.id], (constructor, key) => constructor({ pluginId, type, key }));
  return acc;
}, {});
var createResource = (providers) => {
  const helper = Object.fromEntries(providers.map((provider) => [provider.type.id, provider.factory]));
  return (name, template) => ({
    ...createPluginResources(providers, name, template(helper)),
    id: name
  });
};

// packages/platform/src/resources/i18n.ts
var translate = (i18n, params) => JSON.stringify({ i18n, params });
var i18nProvider = {
  type: createResourceType("i18n"),
  factory: () => (i18n) => (params) => translate(i18n, params)
};

// packages/platform/src/resources/status.ts
var Result;
(function(Result2) {
  Result2[Result2["OK"] = 0] = "OK";
  Result2[Result2["ERROR"] = 1] = "ERROR";
})(Result || (Result = {}));
var statusProvider = {
  type: createResourceType("status"),
  factory: (result) => (id) => (params, message) => ({
    id,
    result,
    params,
    message
  })
};

// packages/platform/src/index.ts
var createPlatform = function(configuration, providers) {
  return {
    IO: createIO(configuration),
    plugin: createResource(providers)
  };
};

class PlatformError extends Error {
  status;
  constructor(status2) {
    super();
    this.status = status2;
  }
}
var configuration = {
  errorToStatus: (error) => {
    if (error instanceof PlatformError)
      return error.status;
    throw error;
  },
  defaultFailureHandler: (status2) => {
    console.error("unhandled status: ", status2);
  }
};
var Platform = createPlatform(configuration, [i18nProvider, statusProvider]);
export {
  PlatformError,
  Platform
};
