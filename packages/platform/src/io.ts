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

abstract class IOBase<I, O> implements IO<I, O> {
  private out?: Sink<O> | Sink<O>[]

  protected notifySuccess(result: O) {
    if (this.out)
      if (Array.isArray(this.out)) for (const sink of this.out) sink.success(result)
      else this.out.success(result)
  }

  to<X extends Sink<O>>(sink: X): X {
    if (this.out)
      if (Array.isArray(this.out)) this.out.push(sink)
      else this.out = [this.out, sink]
    else this.out = sink
    return sink
  }

  abstract success(input: I): void
  failure(): void {}
}

class SyncIO<I, O> extends IOBase<I, O> {
  constructor(private readonly op: (value: I) => O) {
    super()
  }
  success(input: I) {
    this.notifySuccess(this.op(input))
  }
}

class SyncCode<I, O> extends IOBase<I, O> {
  constructor(private readonly code: (x: I) => Generator<IO<any, any>, O>) {
    super()
  }
  success(input: I) {
    const i = this.code(input)
    function loop(value?: any) {
      const next = i.next(value)
      if (!next.done) {
        const io = next.value
        io.to({ success: (value: any) => loop(value), failure: () => {} })
        io.success(value)
      }
    }
    loop()
  }
}

class AsyncIO<I, O> extends IOBase<I, O> {
  constructor(private readonly op: (value: I) => Promise<O>) {
    super()
  }
  success(input: I) {
    this.op(input).then(this.notifySuccess)
  }
}

class AsyncCode<I, O> extends IOBase<I, O> {
  constructor(private readonly code: (x: I) => AsyncGenerator<IO<any, any>, O>) {
    super()
  }
  success(input: I) {
    const i = this.code(input)
    function loop(value?: any) {
      const next = i.next(value)
      next.then(({ done, value }) => {
        if (!done) {
          value.to({ success: (value: any) => loop(value), failure: () => {} })
          value.success(value)
        }
      })
    }
    loop()
  }
}

export const syncIO = <I, O>(op: (value: I) => O): IO<I, O> => new SyncIO(op)
export const asyncIO = <I, O>(op: (value: I) => Promise<O>): IO<I, O> => new AsyncIO(op)
export const syncCode = <I, O>(code: (x: I) => Generator<IO<any, any>>): IO<I, O> => new SyncCode(code)
export const asyncCode = <I, O>(code: (x: I) => AsyncGenerator<IO<any, any>>): IO<I, O> => new AsyncCode(code)

// export const success = <I,>(value: I): Out<I> => syncIO(() => value)

export const chain = <I, O>(out: Out<I>, op: (value: I) => O): Out<O> => out.to(syncIO(op))
