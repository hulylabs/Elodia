//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import type { ResourceId } from './types'

type PluginId = string & { __tag: 'plugin' }

interface Factory<V> {
  __factory: (id: ResourceId<V>) => V
}

type CategoryResources = { [key: string]: unknown }
type CategoryResourcesAfterFactories<V extends CategoryResources> = {
  [K in keyof V]: V[K] extends Factory<infer T> ? T : V[K]
}

type PluginResources = Record<string, CategoryResources>
type PluginResourcesAfterFactories<R extends PluginResources> = {
  [K in keyof R]: CategoryResourcesAfterFactories<R[K]>
}

function mapObject<T, U>(
  values: Record<string, T>,
  prefix: string,
  fn: (prefix: string, value: T) => U,
): Record<string, U> {
  const result: Record<string, U> = {}
  for (const key in values) {
    result[key] = fn(prefix + ':' + key, values[key])
  }
  return result
}

function isFactory(value: unknown): value is Factory<unknown> {
  return typeof value === 'object' && value !== null && '__factory' in value
}

const callFactory = (id: string, value: unknown): unknown =>
  isFactory(value) ? value.__factory(id as ResourceId<any>) : value

interface FactoryProvider {
  <V>(factory: (id: ResourceId<V>) => V): Factory<V>
  <X>(): Factory<ResourceId<X>>
}

const factoryProvider = <V,>(factory?: (id: ResourceId<V>) => V) => ({
  __factory: factory || ((id: ResourceId<V>) => id),
})

const plugin = <R extends PluginResources>(name: string, init: (_: FactoryProvider) => R) => ({
  id: name as PluginId,
  ...(mapObject(init(factoryProvider), name, (name, category) =>
    mapObject(category, name, (id, value) => callFactory(id, value)),
  ) as PluginResourcesAfterFactories<R>),
})

export const Resources = {
  plugin,
}
