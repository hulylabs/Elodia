//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { type IO } from './io'
import type { ResourceId } from './types'

export type PluginId = string & { __tag: 'plugin' }

type LocalizedStringLoader = () => IO<string, Record<string, string>>

interface PluginDescriptor {
  id: PluginId
  setLocalizedStringLoader: (loader: LocalizedStringLoader) => void
  getLocalizedStrings: LocalizedStringLoader
}

interface Plugin {
  $: PluginDescriptor
}

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

const destructureId = (id: ResourceId<any>) => {
  const parts = id.split(':')
  return {
    pluginId: parts[0] as PluginId,
    category: parts[1],
    key: parts[2],
  }
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

const stringLoaders: Map<PluginId, LocalizedStringLoader> = new Map()
const plugins: Map<PluginId, Plugin> = new Map()

function plugin<R extends PluginResources>(name: string, init: (_: FactoryProvider) => R) {
  const id = name as PluginId

  const resources = mapObject(init(factoryProvider), name, (name, category) =>
    mapObject(category, name, (id, value) => callFactory(id, value)),
  ) as PluginResourcesAfterFactories<R>

  const descriptor: PluginDescriptor = {
    id,
    setLocalizedStringLoader: (loader: LocalizedStringLoader) => {
      stringLoaders.set(id, loader)
    },
    getLocalizedStrings: (): IO<string, Record<string, string>> => {
      const loader = stringLoaders.get(id)
      if (!loader) {
        throw new Error(`No localized string loader for plugin: ${id}`)
      }
      return loader()
    },
  }

  const plugin = { $: descriptor, ...resources }
  plugins.set(id, plugin)
  return plugin
}

const getPlugin = (id: PluginId): Plugin => {
  const plugin = plugins.get(id)
  if (!plugin) {
    throw new Error(`No plugin with id: ${id}`)
  }
  return plugin
}

export const Resources = {
  destructureId,
  plugin,
  getPlugin,
}
