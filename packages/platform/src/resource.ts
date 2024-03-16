//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

/**
 * In the Huly Platform, a "ResourceId" is a unique identifier that represents a reference
 * to an entity such as an object, function, asset, or UI component, all of which are
 * contributed by plugins. A ResourceId is essentially a string like 'core:function:Optimize',
 * which can be utilized at runtime to retrieve its linked resource. This ID-centric approach
 * is foundational to the platform's modular and scalable architecture.
 *
 * The ResourceId<T> type provides strong typing for identifiers to ensure proper usage
 * within the system, enforcing type safety and preventing misuse.
 *
 * Example:
 *
 * // Logging a ResourceId will output the string ID
 * console.log(core.function.Optimize);  // Output: 'core:function:Optimize'
 */

export type ResourceId<T> = string & { __resource: T }

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
  return result
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
  factory<T, V>(value: (id: ResourceId<T>) => V): CreateValueUsingId<T, V>
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
