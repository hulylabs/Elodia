//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { getStatus, PlatformError } from './platform'
import { Result, type Params, type Status } from './types'

export interface Effect<V, M extends Params, P extends M = M> {
  then(success: (value: V) => void, failure?: (status: Status<M, P>) => void): void
}

type Code<V> = Generator<Code<any>, V>

interface CodeExtractor {
  <V, M extends Params, P extends M>(effect: Effect<V, M, P>): Code<V>
}

type Program<V> = (_: CodeExtractor) => Code<V>

function execute<R, M extends Params, P extends M>(code: Code<R>): [Result, Status<M, P> | R] {
  try {
    const block = code.next()
    return block.done ? [Result.OK, block.value] : execute(block.value)
  } catch (error) {
    if (error instanceof Error) return [Result.ERROR, getStatus(error) as Status<M, P>]
    throw error // not our business
  }
}

function syncExtractor<T, M extends Params, P extends M>(effect: Effect<T, M, P> & SyncEffect): Code<T> {
  if (effect.hasCode) {
    return (effect as SyncCode<T, M, P>).code
  } else {
    const status = (effect as SyncFailure<T, M, P>).status
    throw new PlatformError(status)
  }
}

abstract class SyncEffect {
  readonly hasCode: boolean

  constructor(hasCode: boolean) {
    this.hasCode = hasCode
  }
}

class SyncCode<V, M extends Params, P extends M> extends SyncEffect implements Effect<V, M, P> {
  readonly code: Code<V>

  constructor(program: Program<V>) {
    super(true)
    this.code = program(syncExtractor as CodeExtractor)
  }

  public then(success: (value: V) => void, failure?: (status: Status<M, P>) => void): void {
    const [result, value] = execute<V, M, P>(this.code)
    if (result === Result.OK) {
      success(value as V)
    } else {
      if (failure) {
        if (value) {
          failure(value as Status<M, P>)
        } else {
          throw new Error('failure callback is required')
        }
      }
    }
  }
}

class SyncFailure<V, M extends Params, P extends M = M> extends SyncEffect implements Effect<V, M, P> {
  readonly status: Status<M, P>

  constructor(status: Status<M, P>) {
    super(false)
    this.status = status
  }

  public then(_: (value: V) => void, failure?: (status: Status<M, P>) => void): void {
    failure?.(this.status)
  }
}

const syncCode = <R, M extends Params, P extends M>(program: Program<R>): Effect<R, M, P> =>
  new SyncCode<R, M, P>(program)

const success = <T, M extends Params, P extends M>(x: T): Effect<T, M, P> =>
  syncCode<T, M, P>(function* () {
    return x
  })

const failure = <M extends Params, P extends M>(x: Status<M, P>): Effect<never, M, P> => new SyncFailure(x)

const sync = <T, F extends () => T, M extends Params, P extends M>(f: F): Effect<T, M, P> =>
  syncCode(function* () {
    return f()
  })

// Todo: Tick and remove recursion for sync execution
const runSync = <T, M extends Params, P extends M>(effect: Effect<T, M, P>): T => {
  let value: T = null as any
  let status: Status<M, P> = null as any

  effect.then(
    (v) => (value = v),
    (s) => (status = s),
  )

  if (status !== null && status.result !== Result.OK) throw new PlatformError(status)

  return value
}

export const Effects = {
  syncCode,
  sync,
  success,
  failure,
  runSync,
}
