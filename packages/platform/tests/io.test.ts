//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/io.test.ts
//

import { expect, test } from 'bun:test'

import { PlatformError, Result, type Status, type StatusId } from '../src/'
import { createIO, type IOConfiguration } from '../src/modules/io'
import { expectIO } from './util'

export const configuration: IOConfiguration = {
  errorToStatus: (error: unknown): Status<any> => {
    if (error instanceof PlatformError) return error.status
    if (error instanceof Error)
      return {
        id: 'platform.status.UnknownError' as unknown as StatusId<{ message: string }>,
        result: Result.ERROR,
        params: { message: error.message },
      }
    throw error // not our business
  },
  defaultFailureHandler: (status: Status<any>): void => {
    console.error('unhandled status: ', status)
  },
}

const IO = createIO(configuration).api

test('expect', () => {
  const x = IO.pipe(
    IO.success(111),
    IO.syncIO((x) => x * 3),
  )
  expectIO(x, (value) => expect(value).toBe(333))
})

// test('diagnostics', () => {
//   const add = IO.syncIO((x: number) => x + 1)
//   setId(add, 'add' as ResourceId)
//   const mul = IO.syncIO((x: number) => x + 2)
//   setId(mul, 'mul' as ResourceId)
//   add.pipe(mul)
//   printDiagnostic(add)
//   printDiagnostic(mul)
// })

// test('pipe test', () => {
//   const add = IO.syncIO((x: number) => x + 1)
//   setId(add, 'add' as ResourceId)
//   const mul = IO.syncIO((x: number) => x * 2)
//   setId(mul, 'mul' as ResourceId)
//   const x = pipe(mul, add)
//   printDiagnostic(x as any)
//   expectIO(x, (value) => expect(value).toBe(-1))
// })

// test('sync code', () => {
//   const x = IO.syncCode(function* () {
//     yield IO.syncIO((x) => x + 1)
//     yield IO.syncIO((x) => x + 1)
//     const x = yield IO.syncIO((x) => x + 1)
//     console.log('x', x)
//     yield IO.syncIO((x) => x + 1)
//     yield IO.syncIO((x) => x + 'sync')
//     yield IO.syncIO((x) => x + 1)
//   })
//   x.pipe({ success: (x) => console.log('success', x), failure: () => {} })
//   x.success(100)
// })

// test('async io', () => {
//   const io = IO.asyncIO(async (x: number) => x + 1)
//   io.pipe({ success: (x) => console.log('success', x), failure: () => {} })
//   io.success(100)
// })

// test('mixed code in sync gen', () => {
//   const x = IO.syncCode(function* () {
//     yield IO.syncIO((x) => x + 1)
//     yield IO.syncIO((x) => x + 1)
//     const x = yield IO.syncIO((x) => x + 1)
//     console.log('x', x)
//     yield IO.syncIO((x) => x + 1)
//     yield IO.asyncIO(async (x) => x + 'async')
//     yield IO.syncIO((x) => x + 1)
//   })
//   x.pipe({ success: (x) => console.log('success', x), failure: () => {} })
//   x.success(100)
// })

// test('mixed code in async gen', () => {
//   const x = IO.asyncCode(async function* () {
//     yield IO.syncIO((x) => x + 1)
//     yield IO.syncIO((x) => x + 1)
//     const x = yield IO.syncIO((x) => x + 1)
//     console.log('x', x)
//     yield IO.syncIO((x) => x + 1)
//     yield IO.asyncIO(async (x) => x + 'async')
//     yield IO.syncIO((x) => x + 1)
//   })
//   x.pipe({ success: (x) => console.log('success', x), failure: () => {} })
//   x.success(1000)
// })

// test('yeld* test', () => {
//   const sub = IO.syncCode(function* () {
//     yield IO.syncIO((x) => x + 1)
//     yield IO.syncIO((x) => x + 1)
//   })
//   const root = IO.syncCode(function* () {
//     yield IO.syncIO((x) => x + 1)
//     const s = yield* sub
//     yield IO.syncIO((x) => x + 1)
//     console.log('s', s)
//   })

//   root.pipe({ success: (x) => console.log('success', x), failure: () => {} })
//   root.success(500)
// })
