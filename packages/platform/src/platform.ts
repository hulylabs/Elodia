//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import type { Effect, ResourceId, Status } from './types'

// R E S O U R C E  I D

export function makeResourceId(plugin: string, category: string, name: string): ResourceId {
  return `${plugin}:${category}:${name}` as ResourceId
}

export function parseResourceId(id: ResourceId): [string, string, string] {
  const [plugin, category, name] = id.split(':')
  return [plugin, category, name]
}

// E F F E C T S

type Effects = Record<string, Effect>
type PluginEffects = Record<string, Effects>

type Code<V> = Generator<Code<any>, V>

interface CodeExtractor {
  <V extends any>(effect: Effect<V>): Code<V>
}

type Program<V> = (_: CodeExtractor) => Code<V>

function execute<R>(code: Code<R>): R {
  const block = code.next()
  return block.done ? block.value : execute(block.value)
}

const syncExtractor = (<T extends any>(effect: SyncEffect<T>): Code<T> => effect.code) as CodeExtractor

class SyncEffect<V, S extends Status = Status> implements Effect<V, S> {
  readonly code: Code<V>

  constructor(program: Program<V>) {
    this.code = program(syncExtractor)
  }

  public then(success: (value: V) => void, _?: (status: S) => void): void {
    success(execute(this.code))
  }
}

// P L A T F O R M

const syncCode = <R,>(program: Program<R>): Effect<R> => new SyncEffect<R, Status>(program)

const success = <T,>(x: T): Effect<T> =>
  syncCode(function* () {
    return x
  })

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

  plugin: <R extends PluginEffects>(_name: string, resources: R): R => resources,
})
