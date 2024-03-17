//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { getStatus, PlatformError } from './platform'
import { Result, type Params, type Status } from './types'

export interface Effect<V, M extends Params, P extends M = M> {
  then(success: (value: V) => void, failure?: (status: Status<M, P>) => void): void
}

type Tick = [EffectKind, Code<any>]
type SyncCode<V> = Generator<Tick, V>
type AsyncCode<V> = AsyncGenerator<Tick, V>
type Code<V> = SyncCode<V> | AsyncCode<V>

interface Launcher {
  <T, M extends Params, P extends M>(effect: Effect<T, M, P>): Code<T>
}

type SyncProgram<V> = (_: Launcher) => SyncCode<V>
type AsyncProgram<V> = (_: Launcher) => AsyncCode<V>
type Program<V> = (_: Launcher) => Code<V>

enum EffectKind {
  Sync,
  ASync,
}

abstract class EffectImpl<V, M extends Params, P extends M> implements Effect<V, M, P> {
  abstract readonly code: Code<V>

  abstract getKind(): EffectKind
  abstract isExecutable(): boolean

  protected static launch<T, M extends Params, P extends M>(effect: Effect<T, M, P>): Code<T> {
    const impl = effect as EffectImpl<T, M, P>
    const kind = impl.getKind()
    switch (kind) {
      case EffectKind.Sync:
        if (impl.isExecutable()) return impl.code
        break
      case EffectKind.ASync:
        if (impl.isExecutable()) return impl.code
        break
    }
    throw new PlatformError((effect as SyncFailure<T, M, P>).status)
  }

  protected static async syncExecute<R, M extends Params, P extends M>(
    code: SyncCode<R>,
  ): Promise<[Result, Status<M, P> | R]> {
    try {
      const block = code.next()
      if (block.done) return [Result.OK, block.value]
      const [kind, next] = block.value
      if (kind === EffectKind.Sync) return EffectImpl.syncExecute(next as SyncCode<any>)
      return EffectImpl.asyncExecute(next as AsyncCode<any>)
    } catch (error) {
      if (error instanceof Error) return [Result.ERROR, getStatus(error) as Status<M, P>]
      throw error // not our business
    }
  }

  protected static async asyncExecute<R, M extends Params, P extends M>(
    code: AsyncCode<R>,
  ): Promise<[Result, Status<M, P> | R]> {
    try {
      const block = await code.next()
      if (block.done) return [Result.OK, block.value]
      const [kind, next] = block.value
      if (kind === EffectKind.Sync) return EffectImpl.syncExecute(next as SyncCode<any>)
      return EffectImpl.asyncExecute(next as AsyncCode<any>)
    } catch (error) {
      if (error instanceof Error) return [Result.ERROR, getStatus(error) as Status<M, P>]
      throw error // not our business
    }
  }

  abstract then(success: (value: V) => void, failure?: (status: Status<M, P>) => void): void
}

class SyncEffect<V, M extends Params, P extends M> extends EffectImpl<V, M, P> {
  readonly code: SyncCode<V>

  getKind(): EffectKind {
    return EffectKind.Sync
  }

  isExecutable(): boolean {
    return true
  }

  constructor(program: SyncProgram<V, M, P>) {
    super()
    this.code = program(EffectImpl.launch)
  }

  public then(success: (value: V) => void, failure?: (status: Status<M, P>) => void): void {
    EffectImpl.syncExecute<V, M, P>(this.code).then(([result, value]) => {
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
    })
  }
}

class AsyncEffect<V, M extends Params, P extends M> extends EffectImpl<V, M, P> {
  readonly code: AsyncCode<V>

  getKind(): EffectKind {
    return EffectKind.ASync
  }

  isExecutable(): boolean {
    return true
  }

  constructor(program: AsyncProgram<V, M, P>) {
    super()
    this.code = program(EffectImpl.launch)
  }

  public then(success: (value: V) => void, failure?: (status: Status<M, P>) => void): void {
    EffectImpl.asyncExecute<V, M, P>(this.code).then(([result, value]) => {
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
    })
  }
}

class SyncFailure<V, M extends Params, P extends M = M> extends EffectImpl<V, M, P> {
  getKind(): EffectKind {
    return EffectKind.Sync
  }

  isExecutable(): boolean {
    return false
  }

  readonly status: Status<M, P>

  constructor(status: Status<M, P>) {
    this.status = status
  }

  public then(_: (value: V) => void, failure?: (status: Status<M, P>) => void): void {
    failure?.(this.status)
  }
}

const success = <T, M extends Params, P extends M>(x: T): Effect<T, M, P> =>
  syncCode<T, M, P>(function* () {
    return x
  })

const failure = <M extends Params, P extends M>(x: Status<M, P>): Effect<never, M, P> => new SyncFailure(x)

const syncCode = <R, M extends Params, P extends M>(program: SyncProgram<R, M, P>): Effect<R, M, P> =>
  new SyncEffect<R, M, P>(program)

const sync = <T, F extends () => T, M extends Params, P extends M>(f: F): Effect<T, M, P> =>
  syncCode(function* () {
    return f()
  })

const asyncCode = <R, M extends Params, P extends M>(program: AsyncProgram<R, M, P>): Effect<R, M, P> =>
  new AsyncEffect<R, M, P>(program)

// const async = <T, F extends () => Promise<T>, M extends Params, P extends M>(f: F): Effect<T, M, P> =>
//   asyncCode(function* () {
//     return f()
//   })

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

  asyncCode,
  // async,

  success,
  failure,

  runSync,
}
