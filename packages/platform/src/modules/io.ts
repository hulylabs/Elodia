//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/module/io.ts
//

import type { Status } from '../'
import { addCompList, iterateCompList, type CompList } from '../util'

type Success<T> = (result: T) => void
type Failure = (status: Status) => void

export interface Sink<T> {
  success: Success<T>
  failure?: Failure
}
export interface Out<O> {
  pipe: <X extends Sink<O>>(input: Sink<O>) => X
}
export interface IO<I, O> extends Sink<I>, Out<O> {}

type AnyIO = IO<any, any>

enum State {
  Pending,
  Success,
  Failure,
}

abstract class IODiagnostic<I, O> implements IO<I, O> {
  protected static sequence = 0

  id = `io-${(IODiagnostic.sequence++).toString(32)}`

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

export function pipe<A, B>(io: IO<A, B>): IO<A, B>
export function pipe<A, B, C>(io1: IO<A, B>, io2: IO<B, C>): IO<A, C>
export function pipe<A, B, C, D>(io1: IO<A, B>, io2: IO<B, C>, io3: IO<C, D>): IO<A, D>
export function pipe<A, B, C, D, E>(io1: IO<A, B>, io2: IO<B, C>, io3: IO<C, D>, io4: IO<D, E>): IO<A, E>

export function pipe(...ios: IO<any, any>[]): IO<any, any> {
  const first = ios[0]
  const last = ios.reduce((io, current) => io.pipe(current))
  // return new PipeIO(first, last)
  return {
    success: (input) => first.success(input),
    failure: (status: Status) => first.failure?.(status),
    pipe<X extends Sink<any>>(sink: Sink<any>): X {
      last.pipe(sink)
      return sink as X
    },
  }
}

export const setId = <I, O>(io: IO<I, O>, id: string) => {
  ;(io as any).id = id
}
export const getId = <I, O>(io: IO<I, O>): string | undefined => (io as any).id

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

  class AsyncIO<I, O> extends IOBase<I, O> {
    constructor(private readonly op: (value: I) => Promise<O>) {
      super()
    }
    success(input: I): Out<O> {
      this.op(input).then(this.setResult.bind(this), this.setStatus.bind(this))
      return this
    }
  }

  return {
    api: {
      syncIO: <I, O>(op: (value: I, pipe?: Out<O>) => O): IO<I, O> => new SyncIO(op),
      asyncIO: <I, O>(op: (value: I) => Promise<O>): IO<I, O> => new AsyncIO(op),
    },
    resources: {},
  }
}
