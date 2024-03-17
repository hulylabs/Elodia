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
  pipe: <X extends Sink<O>>(input: X) => X
}

export interface IO<I, O> extends Sink<I>, Out<O> {}

type AnyIO = IO<any, any>

interface SyncIterator<I, O> extends IO<I, O> {
  [Symbol.iterator](): Iterator<AnyIO, O>
}

abstract class IOBase<I, O> implements IO<I, O> {
  private out?: Sink<O> | Sink<O>[]
  private processed: boolean = false
  private result?: O

  protected setResult(result: O): void {
    this.result = result
    this.processed = true
    if (this.out)
      if (Array.isArray(this.out)) for (const sink of this.out) sink.success(this.result!)
      else this.out.success(this.result!)
  }

  pipe<X extends Sink<O>>(sink: X): X {
    if (this.out)
      if (Array.isArray(this.out)) this.out.push(sink)
      else this.out = [this.out, sink]
    else this.out = sink
    if (this.processed) sink.success(this.result!)
    return sink // for chaining
  }

  abstract success(input: I): void
  failure(): void {}
}

class SyncIO<I, O> extends IOBase<I, O> {
  constructor(private readonly op: (value: I) => O) {
    super()
  }
  success(input: I) {
    this.setResult(this.op(input))
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
      failure: () => {},
    })
    io.success(input)
  }

  success(input: I) {
    const i = this.code()
    const next = i.next()
    if (!next.done) this.loop(next.value, i, input)
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
  success(input: I) {
    this.op(input).then(this.setResult.bind(this))
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

  success(input: I) {
    const i = this.code(input)
    const loop = this.loop.bind(this)
    const next = i.next()
    next.then((next) => {
      if (!next.done) loop(next.value, i, input)
    })
  }
}

const syncIO = <I, O>(op: (value: I) => O): IO<I, O> => new SyncIO(op)
const asyncIO = <I, O>(op: (value: I) => Promise<O>): IO<I, O> => new AsyncIO(op)
const syncCode = <I, O>(code: () => Generator<IO<any, any>>): SyncIterator<I, O> => new SyncCode(code)
const asyncCode = <I, O>(code: (x: I) => AsyncGenerator<IO<any, any>>): IO<I, O> => new AsyncCode(code)

// export const success = <I,>(value: I): Out<I> => syncIO(() => value)

const chain = <I, O>(out: Out<I>, op: (value: I) => O): Out<O> => out.pipe(syncIO(op))

export const IO = {
  syncIO,
  asyncIO,
  syncCode,
  asyncCode,

  chain,
}
