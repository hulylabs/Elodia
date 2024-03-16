//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

/**
 * The Huly Platform defines a "Resource" as a unique identifier representing an entity
 * contributed by plugins within the system. Types of such entities include objects,
 * configurations, functions, assets, or UI components. These resources are provided by the
 * contributors of the plugins and are then managed and made accessible by the Huly Platform.
 *
 * The purpose of resource identifiers is to allow for easy and distinct referencing of
 * these contributed resources anywhere in the codebase. By design, a Resource ID (a
 * string such as 'core:function:Optimize') can be used to fetch the associated resource
 * at runtime. This mechanism is essential to the Huly Platform's architecture, enabling the
 * scalability and modularity of the system.
 *
 * To maintain type safety and distinguish between simple strings and resource identifiers,
 * the Resource<T> type is used. It is, in essence, a string that embodies the resource's ID,
 * but it also carries type information specifying what kind of entity the ID refers to.
 * This typing ensures that each resource is used correctly according to its intended purpose.
 *
 * Example:
 *
 * // Resource<T> is a string at its core. When logged, it will display 'core:function:Optimize'.
 * console.log(core.function.Optimize); // Output: 'core:function:Optimize'
 */

export type Resource<T> = string & { __resource: T }

interface ValuePolicy {
  keepId: boolean
}

interface KeepResourceId<T> extends ValuePolicy {
  keepId: true
  cacheValue?: T
}

interface CreateValueUsingId<T, V> extends ValuePolicy {
  keepId: false
  factory: (id: Resource<T>) => V
}

type CategoryValues = { [key: string]: unknown }
type CategoryResources<V extends CategoryValues> = {
  [K in keyof V]: V[K] extends KeepResourceId<infer T>
    ? Resource<T>
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
  return result
}

const allResources = new Map<string, unknown>()

function isValuePolicy(value: unknown): value is ValuePolicy {
  return typeof value === 'object' && value !== null && 'keepId' in value
}

function applyPolicy(id: string, value: unknown): unknown {
  if (isValuePolicy(value)) {
    if (value.keepId) {
      const keepResourceId = value as KeepResourceId<any>
      if (keepResourceId.cacheValue) {
        allResources.set(id, keepResourceId.cacheValue)
      }
      return id as Resource<any>
    } else {
      const createValueUsingId = value as CreateValueUsingId<any, any>
      const result = createValueUsingId.factory(id as Resource<any>)
      return result
    }
  }
  return value
}

interface Policy {
  external<T>(): KeepResourceId<T>
  internal<T>(value: T): KeepResourceId<T>
  factory<T, V>(value: (id: Resource<T>) => V): CreateValueUsingId<T, V>
}

const external: KeepResourceId<any> = {
  keepId: true,
}

const ident: Policy = {
  external: <T,>(): KeepResourceId<T> => external,
  internal: <T,>(cacheValue: T): KeepResourceId<T> => ({ keepId: true, cacheValue }),
  factory: <T, V>(factory: (id: Resource<T>) => V): CreateValueUsingId<T, V> => ({ keepId: false, factory }),
}

function plugin<R extends PluginValues>(name: string, init: (policy: Policy) => R): PluginResources<R> {
  return mapObject(init(ident), name, (name, category) =>
    mapObject(category, name, (id, value) => applyPolicy(id, value)),
  ) as PluginResources<R>
}

export const Resources = Object.freeze({
  plugin,
})
