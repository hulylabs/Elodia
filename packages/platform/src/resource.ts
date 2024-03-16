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
 * // Define a resource identifier for an optimization function
 * type OptimizeFunctionResource = Resource<() => void>;
 *
 * // Resource<T> is a string at its core. When logged, it will display 'core:function:Optimize'.
 * console.log(OptimizeFunctionResource); // Output: 'core:function:Optimize'
 */

export type Resource<T> = string & { __resource: T }

interface ResourceId<T> {
  __id: boolean
  value: T
}

type CategoryValues = { [key: string]: unknown }
type CategoryResources<V extends CategoryValues> = {
  [K in keyof V]: V[K] extends ResourceId<infer T> ? Resource<T> : V[K]
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

function substitute(id: string, value: unknown) {
  const ident = value as ResourceId<any>
  const resolve = ident.value
  if (ident.__id) {
    if (resolve) {
      allResources.set(id, resolve)
    }
    return id
  } else {
    if (resolve) {
      return resolve()
    }
    return value
  }
}

interface Identifiers {
  external<T>(): ResourceId<T>
  internal<T>(value: T): ResourceId<T>
  factory<T>(value: T): ResourceId<T>
}

const external = {
  __id: true,
} as ResourceId<void>

const ident: Identifiers = {
  external: <T,>(): ResourceId<T> => external as ResourceId<T>,
  internal: <T,>(value: T): ResourceId<T> => ({ __id: true, value }),
  factory: <T,>(value: T): ResourceId<T> => ({ __id: false, value }),
}

function plugin<R extends PluginValues>(name: string, init: (ident: Identifiers) => R): PluginResources<R> {
  return mapObject(init(ident), name, (name, category) =>
    mapObject(category, name, (id, value) => substitute(id, value)),
  ) as PluginResources<R>
}

export const Resources = Object.freeze({
  plugin,
})
