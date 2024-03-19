//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/io.ts
//

import type { ResourceId, Status } from './types'
import { addCompList, iterateCompList, type CompList } from './util'

type AnyIO = IO<any, any>

interface SyncIterator<I, O> extends IO<I, O> {
  [Symbol.iterator](): Iterator<AnyIO, O>
}

enum State {
  Pending,
  Success,
  Failure,
}

abstract class IODiagnostic<I, O> implements IO<I, O> {
  protected static sequence = 0

  id = `io-${(IODiagnostic.sequence++).toString(32)}` as ResourceId<IO<I, O>>

  abstract success(input: I): void
  abstract failure(status: Status): void
  abstract pipe<X extends Sink<O>>(sink: Sink<O>): X

  abstract printDiagnostic(level?: number): void
}

abstract class IOBase<I, O> extends IODiagnostic<I, O> {
  private out: CompList<Sink<O>>
  protected state: State = State.Pending
  protected result?: O | Status

  protected setResult(result: O): void {
    this.result = result
    this.state = State.Success
    for (const sink of iterateCompList(this.out)) sink.success(this.result!)
  }

  protected setStatus(status: Status): void {
    this.result = status
    this.state = State.Failure
    for (const sink of iterateCompList(this.out)) sink.failure?.(this.result!)
  }

  pipe<X extends Sink<O>>(sink: Sink<O>): X {
    this.out = addCompList(this.out, sink)
    switch (this.state) {
      case State.Success:
        sink.success(this.result as O)
        break
      case State.Failure:
        if (sink.failure) sink.failure(this.result as Status)
        break
    }
    return sink as X // for chaining
  }

  failure(status: Status): void {
    this.setStatus(status)
  }

  printDiagnostic(level: number = 0) {
    const indent = '  '.repeat(level) + ' ·'
    console.log(`${indent} IO: ${this.id} (${this.state})`)
    for (const sink of iterateCompList(this.out)) {
      ;(sink as IOBase<any, any>).printDiagnostic(level + 1)
    }
  }
}

class SuccessIO<T> extends IOBase<T, T> {
  constructor(result: T) {
    super()
    this.result = result
    this.state = State.Success
  }

  success(_: T): void {
    throw new Error('No input expected')
  }
}

export const success = <T,>(result: T): IO<T, T> => new SuccessIO(result)

class PipeIO<I, O> extends IODiagnostic<I, O> {
  id = `io-pipe-${(IODiagnostic.sequence++).toString(32)}` as ResourceId<IO<any, any>>

  constructor(
    private readonly first: IO<I, O>,
    private readonly last: IO<I, O>,
  ) {
    super()
  }

  success(input: I): void {
    this.first.success(input)
  }

  failure(status: Status): void {
    this.first.failure?.(status)
  }

  pipe<X extends Sink<O>>(sink: Sink<O>): X {
    this.last.pipe(sink)
    return sink as X
  }

  printDiagnostic() {
    console.log(`IO: ${this.id} (pipe)`)
    ;(this.first as IODiagnostic<any, any>).printDiagnostic(1)
  }
}

export function pipe<A, B>(io: IO<A, B>): IO<A, B>
export function pipe<A, B, C>(io1: IO<A, B>, io2: IO<B, C>): IO<A, C>
export function pipe<A, B, C, D>(io1: IO<A, B>, io2: IO<B, C>, io3: IO<C, D>): IO<A, D>
export function pipe<A, B, C, D, E>(io1: IO<A, B>, io2: IO<B, C>, io3: IO<C, D>, io4: IO<D, E>): IO<A, E>

export function pipe(...ios: IO<any, any>[]): IO<any, any> {
  const first = ios[0]
  const last = ios.reduce((io, current) => io.pipe(current))
  return new PipeIO(first, last)
}

export const setId = <I, O>(io: IO<I, O>, id: ResourceId<IO<I, O>>) => {
  ;(io as any).id = id
}
export const getId = <I, O>(io: IO<I, O>): ResourceId<IO<I, O>> | undefined => (io as any).id

export const printDiagnostic = <I, O>(io: IO<I, O>) => {
  ;(io as IOBase<I, O>).printDiagnostic()
}

export interface IOConfiguration {
  errorToStatus: (error: unknown) => Status
  defaultFailureHandler: Failure
}

export function createIO(config: IOConfiguration) {
  class SyncIO<I, O> extends IOBase<I, O> {
    constructor(private readonly op: (value: I, pipe?: Out<O>) => O) {
      super()
    }

    success(input: I): Out<O> {
      try {
        this.setResult(this.op(input, this))
      } catch (error) {
        this.setStatus(config.errorToStatus(error))
      }
      return this
    }

    [Symbol.iterator](): Iterator<AnyIO, O> {
      throw new Error('Method not implemented.')
    }
  }

  class SyncCode<I, O> extends IOBase<I, O> implements SyncIterator<I, O> {
    constructor(private readonly code: () => Generator<IO<any, any>, O>) {
      super()
    }

    protected loop(io: IO<any, any>, i: Generator<IO<any, any>, any>, input: any) {
      io.pipe({
        success: (value: any) => {
          const next = i.next(value)
          if (!next.done) this.loop(next.value, i, value)
          else this.setResult(value)
        },
        failure: (status: Status) => {
          this.setStatus(status)
        },
      })
      io.success(input)
    }

    success(input: I): Out<O> {
      const i = this.code()
      const next = i.next()
      if (!next.done) this.loop(next.value, i, input)
      return this
    }

    [Symbol.iterator](): Iterator<AnyIO, O> {
      const i = this.code()
      return {
        next: () => {
          return i.next()
        },
      }
    }
  }

  class AsyncIO<I, O> extends IOBase<I, O> {
    constructor(private readonly op: (value: I) => Promise<O>) {
      super()
    }
    success(input: I): Out<O> {
      this.op(input).then(this.setResult.bind(this), this.setStatus.bind(this))
      return this
    }
  }

  class AsyncCode<I, O> extends IOBase<I, O> {
    constructor(private readonly code: (x: I) => AsyncGenerator<IO<any, any>, O>) {
      super()
    }
    protected loop(io: IO<any, any>, i: AsyncGenerator<IO<any, any>>, input: any) {
      io.pipe({
        success: (value: any) => {
          const loop = this.loop.bind(this)
          const notifySuccess = this.setResult.bind(this)
          const next = i.next(value)
          next.then((next) => {
            if (!next.done) loop(next.value, i, value)
            else notifySuccess(value)
          })
        },
        failure: () => {},
      })
      io.success(input)
    }

    success(input: I): Out<O> {
      const i = this.code(input)
      const loop = this.loop.bind(this)
      const next = i.next()
      next.then((next) => {
        if (!next.done) loop(next.value, i, input)
      })
      return this
    }
  }

  const syncIO = <I, O>(op: (value: I, pipe?: Out<O>) => O): IO<I, O> => new SyncIO(op)
  const asyncIO = <I, O>(op: (value: I) => Promise<O>): IO<I, O> => new AsyncIO(op)
  const syncCode = <I, O>(code: () => Generator<IO<any, any>>): SyncIterator<I, O> => new SyncCode(code)
  const asyncCode = <I, O>(code: (x: I) => AsyncGenerator<IO<any, any>>): IO<I, O> => new AsyncCode(code)

  return {
    syncIO,
    asyncIO,
    syncCode,
    asyncCode,
  }
}
