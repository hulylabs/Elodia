//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/io_ext.ts
//

interface SyncIterator<I, O> extends IO<I, O> {
  [Symbol.iterator](): Iterator<AnyIO, O>
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
