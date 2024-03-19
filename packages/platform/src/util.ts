//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/utils.ts
//

export type CompList<T> = T | T[] | undefined

export function* iterateCompList<T>(list: CompList<T>): Generator<T> {
  if (list) {
    if (Array.isArray(list)) for (const sink of list) yield sink
    else yield list
  }
}

export function addCompList<T>(list: CompList<T>, item: T): CompList<T> {
  if (list)
    if (Array.isArray(list)) list.push(item)
    else list = [list, item]
  else list = item
  return list
}

export function mapObjects<T, U>(values: Record<string, T>, fn: (value: T, key: string) => U): Record<string, U> {
  const result: Record<string, U> = {}
  for (const key in values) result[key] = fn(values[key], key)
  return result
}
