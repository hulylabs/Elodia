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
  to: (input: Sink<O>) => void
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
  const to = (sink: Sink<O>) => {
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

export const chain = <I, O>(out: Out<I>, op: (value: I) => O): Out<O> => {
  const io = syncIO(op)
  out.to(io)
  return io
}
