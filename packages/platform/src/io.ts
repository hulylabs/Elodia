//
// © 2024 Hardcore Engineering Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/io.ts
//

import { type Status } from './status'
import { addCompList, iterateCompList, type CompList } from './util'

const io = 'io'

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

enum State {
  Pending,
  Success,
  Failure,
}

//   id = `io-${(IODiagnostic.sequence++).toString(32)}`
//

// printDiagnostic: (level: number = 0) => {
//   const indent = '  '.repeat(level) + ' ·'
//   console.log(`${indent} IO: ${this.id} (${this.state})`)
//   for (const sink of iterateCompList(this.out)) {
//     ; (sink as IOBase<any, any>).printDiagnostic(level + 1)
//   }

export function pipe<A, B>(io: IO<A, B>): IO<A, B>
export function pipe<A, B, C>(io1: IO<A, B>, io2: IO<B, C>): IO<A, C>
export function pipe<A, B, C, D>(io1: IO<A, B>, io2: IO<B, C>, io3: IO<C, D>): IO<A, D>
export function pipe<A, B, C, D, E>(io1: IO<A, B>, io2: IO<B, C>, io3: IO<C, D>, io4: IO<D, E>): IO<A, E>

export function pipe(...ios: IO<any, any>[]): IO<any, any> {
  const first = ios[0]
  const last = ios.reduce((io, current) => io.pipe(current))
  return {
    success: first.success,
    failure: first.failure,
    pipe<X extends Sink<any>>(sink: Sink<any>): X {
      last.pipe(sink)
      return sink as X
    },
  }
}

export interface IOConfiguration {
  errorToStatus: (error: unknown) => Status
  defaultFailureHandler: Failure
}

export function createIO(config: IOConfiguration) {
  function createNode<I, O>(
    ctor: (node: Sink<O> & Out<O>) => IO<I, O>,
    initState = State.Pending,
    initResult?: O | Status,
  ) {
    let out: CompList<Sink<O>>
    let state = initState
    let result = initResult

    return ctor({
      success: (value: O) => {
        result = value
        state = State.Success
        for (const sink of iterateCompList(out)) sink.success(result)
      },

      failure: (status: Status) => {
        result = status
        state = State.Failure
        for (const sink of iterateCompList(out)) sink.failure?.(result)
      },

      pipe: <X extends Sink<O>>(sink: Sink<O>): X => {
        out = addCompList(out, sink)
        switch (state) {
          case State.Success:
            sink.success(result as O)
            break
          case State.Failure:
            if (sink.failure) sink.failure(result as Status)
            break
        }
        return sink as X // for chaining
      },
    })
  }

  const syncIO = <I, O>(op: (value: I, pipe?: Out<O>) => O): IO<I, O> =>
    createNode((node) => ({
      pipe: node.pipe,
      success: (input: I): Out<O> => {
        try {
          node.success(op(input, node))
        } catch (error) {
          node.failure!(config.errorToStatus(error))
        }
        return node
      },
      failure: node.failure!,
    }))

  const asyncIO = <I, O>(op: (value: I, pipe?: Out<O>) => Promise<O>): IO<I, O> =>
    createNode((node) => ({
      pipe: node.pipe,
      success: (input: I): Out<O> => {
        op(input).then(node.success, node.failure!)
        return node
      },
      failure: node.failure!,
    }))

  const success = <T,>(result: T) => createNode((node) => node, State.Success, result)

  return {
    id: io,
    api: {
      syncIO,
      asyncIO,
      success,
      pipe,
    },
    resources: {},
  }
}
