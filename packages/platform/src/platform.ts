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

function syncExtractor<T extends any>(effect: Effect<T> & SyncEffect): Code<T> {
  if (effect.hasCode) {
    return (effect as SyncCode<T>).code
  } else {
    throw (effect as SyncFailure<T>).status
  }
}

abstract class SyncEffect {
  readonly hasCode: boolean

  constructor(hasCode: boolean) {
    this.hasCode = hasCode
  }
}

class SyncCode<V, S extends Status = Status> extends SyncEffect implements Effect<V, S> {
  readonly code: Code<V>

  constructor(program: Program<V>) {
    super(true)
    this.code = program(syncExtractor as CodeExtractor)
  }

  public then(success: (value: V) => void, _?: (status: S) => void): void {
    success(execute(this.code))
  }
}

class SyncFailure<V, S extends Status = Status> extends SyncEffect implements Effect<V, S> {
  readonly status: S

  constructor(status: S) {
    super(false)
    this.status = status
  }

  public then(_: (value: V) => void, failure?: (status: S) => void): void {
    failure?.(this.status)
  }
}

// P L A T F O R M

const syncCode = <R,>(program: Program<R>): Effect<R> => new SyncCode<R, Status>(program)

const success = <T,>(x: T): Effect<T> =>
  syncCode(function* () {
    return x
  })

const failure = <S extends Status>(x: S): Effect<never, S> => new SyncFailure(x)

const sync = <T, F extends () => T>(f: F): Effect<T> =>
  syncCode(function* () {
    return f()
  })

export const Platform = Object.freeze({
  syncCode,
  sync,
  success,
  failure,

  // runSync,
  // runProgram,

  // run: <R, S extends Status>(effect: Effect<R, S>): Value<R, S> =>
  //   effect(context),

  plugin: <R extends PluginEffects>(_name: string, resources: R): R => resources,
})
