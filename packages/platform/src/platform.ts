//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import type { Context, Effect, ResourceId, Status, Value } from './types'

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

// U T I L I T Y

export function mapRecord<K extends string, V, Q>(
  obj: Record<K, V>,
  fn: (value: V) => Q,
): Record<K, Q> {
  const result = {} as Record<K, Q>
  for (const key in obj) {
    result[key] = fn(obj[key])
  }
  return result
}

// R E S O U R C E  D E S C R I P T O R

type Effects = Record<string, Effect>
type PluginEffects = Record<string, Effects>

// type CategoryValues = Record<string, Value>
// type PluginValues = Record<string, CategoryValues>

type ToValues<E extends Effects> = {
  [K in keyof E]: E[K] extends Effect<infer T, infer S> ? Value<T, S> : never
}

type PluginToValues<P extends PluginEffects> = {
  [K in keyof P]: ToValues<P[K]>
}

// V A L U E S

interface ValueKind<V, S extends Status> extends Value<V, S> {
  isSync(): boolean
}

interface SyncValue<V, S extends Status> extends ValueKind<V, S> {
  hasValue(): boolean
  getValue(): V
}

class Success<V, S extends Status> implements SyncValue<V, S> {
  private value: V

  constructor(value: V) {
    this.value = value
  }

  public isSync(): boolean {
    return true
  }

  public hasValue(): boolean {
    return true
  }

  public getValue(): V {
    return this.value
  }

  public then(success: (value: V) => void, _?: (status: S) => void): void {
    success(this.value)
  }
}

class Failure<V, S extends Status> implements SyncValue<V, S> {
  private status: S

  constructor(status: S) {
    this.status = status
  }

  public isSync(): boolean {
    return true
  }

  public hasValue(): boolean {
    return false
  }

  public getValue(): V {
    throw new Error('getValue called on a Failure')
  }

  public then(_: (value: V) => void, failure: (status: S) => void): void {
    failure(this.status)
  }
}

// G E N E R A T O R

const context: Context = {}

function runProgram(code: Generator<Effect, Effect>): void {
  for (let block = code.next(); !block.done; ) {
    const effect = block.value
    const value = effect(context) as SyncValue<any, Status>
    if (value.isSync()) {
      if (value.hasValue()) {
        block = code.next(value.getValue())
      } else {
        block = code.throw(new Error('Terminating program'))
      }
    } else {
      throw new Error('Async value')
    }
  }
}

// P L A T F O R M

const toValues = <R extends Effects>(resources: R): ToValues<R> =>
  mapRecord(resources, Platform.run) as ToValues<R>

export const Platform = Object.freeze({
  success:
    <T,>(x: T): Effect<T> =>
    () =>
      new Success(x),
  failure:
    <S extends Status>(x: S): Effect<never, S> =>
    () =>
      new Failure(x),

  run: <T, S extends Status>(effect: Effect<T, S>): Value<T, S> =>
    effect(context),
  code:
    (generatorFn: () => Generator<Effect, Effect, Effect>): Effect =>
    () => {
      runProgram(generatorFn())
      return VoidValue
    },

  plugin: <R extends PluginEffects>(
    _name: string,
    resources: R,
  ): PluginToValues<R> => mapRecord(resources, toValues) as PluginToValues<R>,
})

// export const StatusOK: Status = { result: Result.OK }
export const VoidValue: Value<void> = Object.freeze({
  then: (success: () => void): void => {
    return success()
  },
})

export const Void: Effect<void> = () => VoidValue
