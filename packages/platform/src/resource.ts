//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

export type Resource<T> = string & { __resource: T }

type CategoryValues = { [key: string]: unknown }
type CategoryResources<V extends CategoryValues> = {
  [K in keyof V]: Resource<V[K]>
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

function addResource<T>(id: string, value: T): Resource<T> {
  allResources.set(id, value)
  return id as Resource<T>
}

export function plugin<R extends PluginValues>(name: string, values: R): PluginResources<R> {
  return mapObject(values, name, (name, category) =>
    mapObject(category, name, (id, value) => addResource(id, value)),
  ) as PluginResources<R>
}
