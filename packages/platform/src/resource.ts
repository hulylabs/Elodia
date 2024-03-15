//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import type {
  Context,
  OptParams,
  Platform,
  ResourceDescriptor,
  ResourceId,
  ResourceOptions,
  Status,
  Value,
} from './types'

// R E S O U R C E  I D

export function makeResourceId(
  plugin: string,
  category: string,
  name: string,
): ResourceId {
  return `${plugin}:${category}:${name}` as ResourceId
}

export function parseResourceId(id: ResourceId): [string, string, string] {
  const [plugin, category, name] = id.split(':')
  return [plugin, category, name]
}

// R E S O U R C E  D E S C R I P T O R

class Descriptor<R = any> implements ResourceDescriptor<R> {
  readonly id: ResourceId
  readonly options: ResourceOptions<R>

  constructor(id: ResourceId, options: ResourceOptions<R>) {
    this.id = id
    this.options = options
  }
}

export function $res<R>(metadata: OptParams): ResourceOptions<R> {
  return { metadata } as ResourceOptions<R>
}

type CategoryOptions = Record<string, ResourceOptions>
type PluginOptions = Record<string, CategoryOptions>

type CategoryDescriptors = Record<string, ResourceDescriptor<any>>
type PluginDescriptors = Record<string, CategoryDescriptors>

type CategoryOptionsToDescriptors<R extends CategoryOptions> = {
  [K in keyof R]: R[K] extends ResourceOptions<infer T>
    ? ResourceDescriptor<T>
    : never
}

type PluginOptionsToDescriptors<R extends PluginOptions> = {
  [K in keyof R]: CategoryOptionsToDescriptors<R[K]>
}

function category<R extends CategoryOptions>(
  plugin: string,
  category: string,
  resources: R,
): CategoryOptionsToDescriptors<R> {
  const result: CategoryDescriptors = {}
  for (const key in resources) {
    result[key] = new Descriptor(
      makeResourceId(plugin, category, key),
      resources[key],
    )
  }
  return result as CategoryOptionsToDescriptors<R>
}

export function plugin<O extends PluginOptions>(
  name: string,
  resources: O,
): PluginOptionsToDescriptors<O> {
  const result: PluginDescriptors = {}
  for (const key in resources) {
    result[key] = category(name, key, resources[key])
  }
  return result as PluginOptionsToDescriptors<O>
}

// E F F E C T

class Success<V, S extends Status> implements Value<V, S> {
  private value: V

  constructor(value: V) {
    this.value = value
  }

  public then(success: (value: V) => void, _: (status: S) => void): void {
    success(this.value)
  }
}

class Failure<V, S extends Status> implements Value<V, S> {
  private status: S

  constructor(status: S) {
    this.status = status
  }

  public then(_: (value: V) => void, failure: (status: S) => void): void {
    failure(this.status)
  }
}

class PlatformContext implements Context {
  get<T>(resource: ResourceDescriptor<T>): T {}

  success<V, S extends Status>(value: V): Value<V, S> {
    return new Success(value)
  }

  failure<V, S extends Status>(status: S): Value<V, S> {
    return new Failure(status)
  }
}

export class PlatformBase implements Platform {
  success<T>(x: T): Value<T, Status> {
    return new Success(x)
  }

  failure<S extends Status>(x: S): Value<never, S> {
    return new Failure(x)
  }
}
