//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import type { ResourceId } from './types'

interface ValueSubstitutionPolicy {
  replaceWithId: boolean
}

interface ReplaceWithResourceId<T> extends ValueSubstitutionPolicy {
  replaceWithId: true
  keepValue?: T
}

interface CreateValueUsingId<T, V> extends ValueSubstitutionPolicy {
  replaceWithId: false
  factory: (id: ResourceId<T>) => V
}

type CategoryValues = { [key: string]: unknown }
type CategoryResources<V extends CategoryValues> = {
  [K in keyof V]: V[K] extends ReplaceWithResourceId<infer T>
    ? ResourceId<T>
    : V[K] extends CreateValueUsingId<any, infer V>
      ? V
      : V[K]
}

type PluginValues = Record<string, CategoryValues>
type PluginResources<R extends PluginValues> = {
  [K in keyof R]: CategoryResources<R[K]>
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
  return Object.freeze(result)
}

const resourceIdToValue = new Map<string, unknown>()

function isValueSubstitutionPolicy(value: unknown): value is ValueSubstitutionPolicy {
  return typeof value === 'object' && value !== null && 'replaceWithId' in value
}

function applyPolicy(id: string, value: unknown): unknown {
  if (isValueSubstitutionPolicy(value)) {
    if (value.replaceWithId) {
      const keepResourceId = value as ReplaceWithResourceId<any>
      if (keepResourceId.keepValue) {
        resourceIdToValue.set(id, keepResourceId.keepValue)
      }
      return id as ResourceId<any>
    } else {
      const createValueUsingId = value as CreateValueUsingId<any, any>
      const result = createValueUsingId.factory(id as ResourceId<any>)
      return result
    }
  }
  return value
}

interface Policy {
  id<T>(cacheValue?: T): ReplaceWithResourceId<T>
  factory<T, V>(value: (id: ResourceId<T>) => V): CreateValueUsingId<T, V> // TODO: T == V?
}

const ident: Policy = {
  id: <T,>(keepValue?: T): ReplaceWithResourceId<T> => ({ replaceWithId: true, keepValue }),
  factory: <T, V>(factory: (id: ResourceId<T>) => V): CreateValueUsingId<T, V> => ({ replaceWithId: false, factory }),
}

function plugin<R extends PluginValues>(name: string, init: (policy: Policy) => R): PluginResources<R> {
  return mapObject(init(ident), name, (name, category) =>
    mapObject(category, name, (id, value) => applyPolicy(id, value)),
  ) as PluginResources<R>
}

export const Resources = Object.freeze({
  plugin,
})
