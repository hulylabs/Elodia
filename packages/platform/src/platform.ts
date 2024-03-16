//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import type { Effect, ResourceId, Status } from './types'

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

// export function mapRecord<K extends string, V, Q>(
//   obj: Record<K, V>,
//   fn: (value: V) => Q,
// ): Record<K, Q> {
//   const result = {} as Record<K, Q>
//   for (const key in obj) {
//     result[key] = fn(obj[key])
//   }
//   return result
// }

// R E S O U R C E  D E S C R I P T O R

type Effects = Record<string, Effect>
type PluginEffects = Record<string, Effects>

// E F F E C T S

export type Code<V> = Generator<Code<any>, V>

interface CodeExtractor {
  <V extends any>(effect: Effect<V>): Code<V>
}

export type Program<V> = (_: CodeExtractor) => Code<V>

function execute<R>(code: Code<R>): R {
  const block = code.next()
  return block.done ? block.value : execute(block.value)
}

class SyncEffect<V, S extends Status> implements Effect<V, S> {
  readonly code: Code<V>

  constructor(program: Program<V>) {
    this.code = program(
      (effect: Effect<V>): Code<V> => (effect as SyncEffect<V, Status>).code,
    )
  }

  public then(success: (value: V) => void, _?: (status: S) => void): void {
    success(execute(this.code))
  }
}

// P L A T F O R M

// const context: Context = {}

// const toValues = <R extends Effects>(resources: R): ToValues<R> =>
//   mapRecord(resources, (effect) => effect(context)) as ToValues<R>

// const runSync =
//   <T, S extends Status>(fn: () => T): Effect<T, S> =>
//   () => {
//     // TODO: catch sync exceptions
//     return new Success(fn())
//   }

const success = <T,>(x: T): Effect<T> =>
  new SyncEffect<T, Status>(function* () {
    return x
  })

const syncCode = <R,>(program: Program<R>): Effect<R> =>
  new SyncEffect<R, Status>(program)

// const failure =
//   <S extends Status>(x: S): Effect<never, S> =>
//   () =>
//     new Failure(x)

export const Platform = Object.freeze({
  syncCode,
  success,
  // failure,

  // runSync,
  // runProgram,

  // run: <R, S extends Status>(effect: Effect<R, S>): Value<R, S> =>
  //   effect(context),

  plugin: <R extends PluginEffects>(_name: string, resources: R): R =>
    resources,
})
