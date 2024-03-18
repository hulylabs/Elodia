//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · resource.ts
//

import { type IO } from './io'
import type { ResourceId } from './types'

export type PluginId = string & { __tag: 'plugin' }

export type Locale = string & { __tag: 'Locale' }
export type LocalizedStrings = Record<string, string>

type LocalizedStringLoader = () => IO<Locale, LocalizedStrings>

interface PluginDescriptor {
  id: PluginId
  setLocalizedStringLoader: (loader: LocalizedStringLoader) => void
  getLocalizedStrings: LocalizedStringLoader
}

interface Plugin {
  $: PluginDescriptor
}

type ResourceFactory<R> = (id: ResourceId<unknown>) => R
interface FactoryBox<R> {
  __preserve_type?: R
  __factory: ResourceFactory<R>
}

function isFactoryBox(value: unknown): value is FactoryBox<unknown> {
  return typeof value === 'object' && value !== null && '__factory' in value
}

interface FactoryWrapper {
  <R>(): FactoryBox<ResourceId<R>> // => ({ __factory: (id: ResourceId<ResourceId<R>>) => id as ResourceId<R> }), // keep resource id as is
  <R>(factory: ResourceFactory<R>): FactoryBox<R> //=> ({ __factory: factory }), // wrap factory
}

const factoryWrapper = <R,>(factory?: ResourceFactory<R>): FactoryBox<R> | FactoryBox<ResourceId<R>> =>
  factory ? { __factory: factory } : { __factory: (id: ResourceId<any>) => id as ResourceId<R> }

type CategoryUResources = { [key: string]: unknown }
type CategoryIResources<V extends CategoryUResources> = {
  [K in keyof V]: V[K] extends FactoryBox<infer T> ? T : V[K]
}

type PluginUResources = Record<string, CategoryUResources>
type PluginIResources<R extends PluginUResources> = {
  [K in keyof R]: CategoryIResources<R[K]>
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

export const pluginId = (id: ResourceId<any>) => destructureId(id).pluginId

const stringLoaders: Map<PluginId, LocalizedStringLoader> = new Map()
const plugins: Map<PluginId, Plugin> = new Map()

const callFactory = (id: string, value: unknown): unknown => {
  if (isFactoryBox(value)) {
    return callFactory(id, value.__factory(id as ResourceId<unknown>))
  }
  return value
}

function plugin<R extends PluginUResources>(name: string, uResources: (_: FactoryWrapper) => R) {
  const id = name as PluginId

  const resources = mapObject(uResources(factoryWrapper), name, (name, category) =>
    mapObject(category, name, callFactory),
  ) as PluginIResources<R>

  const descriptor: PluginDescriptor = {
    id,
    setLocalizedStringLoader: (loader: LocalizedStringLoader) => {
      stringLoaders.set(id, loader)
    },
    getLocalizedStrings: (): IO<Locale, LocalizedStrings> => {
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
