//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

type Success<T> = (result: T) => void
type Failure = () => void

interface Sink<T> {
  success: Success<T>
  failure: Failure
}

export interface Out<O> {
  to: <X extends Sink<O>>(input: X) => X
}

export interface IO<I, O> extends Sink<I>, Out<O> {}

export function syncIO<I, O>(op: (value: I) => O): IO<I, O> {
  let out: Sink<O> | Sink<O>[]

  const success = (input: I) => {
    const result = op(input)
    if (out)
      if (Array.isArray(out)) for (const sink of out) sink.success(result)
      else out.success(result)
  }
  const failure = () => {}
  const to = <X extends Sink<O>>(sink: X): X => {
    if (out)
      if (Array.isArray(out)) out.push(sink)
      else out = [out, sink]
    else out = sink
    return sink
  }

  return {
    success,
    failure,
    to,
  }
}

export function syncCode<I, O>(code: (x: I) => Generator<IO<any, any>>): IO<I, O> {
  const io = {
    success: (input: I) => {
      const i = code(input)
      function loop(value?: any) {
        const next = i.next(value)
        if (!next.done) {
          const io = next.value
          io.to({ success: (value: any) => loop(value), failure: () => {} })
          io.success(value)
        }
      }
      loop()
    },
    failure: () => {
      throw new Error('failure')
    },
    to: (_: Sink<O>) => {
      throw new Error('not implemented')
    },
  }
  return io
}

// export const success = <I,>(value: I): Out<I> => syncIO(() => value)

export const chain = <I, O>(out: Out<I>, op: (value: I) => O): Out<O> => out.to(syncIO(op))

// export function gen(gen: () => Generator<IO>) {
//   const i = gen()
//   const next = (input: any) => {
//     const { value, done } = i.next(input)
//     console.log('got:', value, 'done:', done)
//     if (done) return value
//     return value.to({ success: next, failure: () => {} })
//   }
//   return next
// }
