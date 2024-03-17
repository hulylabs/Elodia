//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'

import { Console } from '../src/console'
import { asyncCode, asyncIO, syncCode, syncIO } from '../src/io'

test('sync code', () => {
  const x = syncCode(function* () {
    yield syncIO((x) => x + 1)
    yield syncIO((x) => x + 1)
    const x = yield syncIO((x) => x + 1)
    console.log('x', x)
    yield syncIO((x) => x + 1)
    yield syncIO((x) => x + 'sync')
    yield syncIO((x) => x + 1)
  })
  x.to({ success: (x) => console.log('success', x), failure: () => {} })
  x.success(100)
})

test('async io', () => {
  const io = asyncIO(async (x: number) => x + 1)
  io.to({ success: (x) => console.log('success', x), failure: () => {} })
  io.success(100)
})

test('mixed code in sync gen', () => {
  const x = syncCode(function* () {
    yield syncIO((x) => x + 1)
    yield syncIO((x) => x + 1)
    const x = yield syncIO((x) => x + 1)
    console.log('x', x)
    yield syncIO((x) => x + 1)
    yield asyncIO(async (x) => x + 'async')
    yield syncIO((x) => x + 1)
  })
  x.to({ success: (x) => console.log('success', x), failure: () => {} })
  x.success(100)
})

test('mixed code in async gen', () => {
  const x = asyncCode(async function* () {
    yield syncIO((x) => x + 1)
    yield syncIO((x) => x + 1)
    const x = yield syncIO((x) => x + 1)
    console.log('x', x)
    yield syncIO((x) => x + 1)
    yield asyncIO(async (x) => x + 'async')
    yield syncIO((x) => x + 1)
  })
  x.to({ success: (x) => console.log('success', x), failure: () => {} })
  x.success(1000)
})

test('yeld* test', () => {
  const sub = syncCode(function* () {
    yield syncIO((x) => x + 1)
    yield syncIO((x) => x + 1)
  })
  const root = syncCode(function* () {
    yield syncIO((x) => x + 1)
    const s = yield* sub
    yield syncIO((x) => x + 1)
    console.log('s', s)
  })

  root.to({ success: (x) => console.log('success', x), failure: () => {} })
  root.success(500)
})
