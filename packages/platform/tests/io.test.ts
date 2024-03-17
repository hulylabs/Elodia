//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'

import { IO } from '../src/io'

test('sync code', () => {
  const x = IO.syncCode(function* () {
    yield IO.syncIO((x) => x + 1)
    yield IO.syncIO((x) => x + 1)
    const x = yield IO.syncIO((x) => x + 1)
    console.log('x', x)
    yield IO.syncIO((x) => x + 1)
    yield IO.syncIO((x) => x + 'sync')
    yield IO.syncIO((x) => x + 1)
  })
  x.to({ success: (x) => console.log('success', x), failure: () => {} })
  x.success(100)
})

test('async io', () => {
  const io = IO.asyncIO(async (x: number) => x + 1)
  io.to({ success: (x) => console.log('success', x), failure: () => {} })
  io.success(100)
})

test('mixed code in sync gen', () => {
  const x = IO.syncCode(function* () {
    yield IO.syncIO((x) => x + 1)
    yield IO.syncIO((x) => x + 1)
    const x = yield IO.syncIO((x) => x + 1)
    console.log('x', x)
    yield IO.syncIO((x) => x + 1)
    yield IO.asyncIO(async (x) => x + 'async')
    yield IO.syncIO((x) => x + 1)
  })
  x.to({ success: (x) => console.log('success', x), failure: () => {} })
  x.success(100)
})

test('mixed code in async gen', () => {
  const x = IO.asyncCode(async function* () {
    yield IO.syncIO((x) => x + 1)
    yield IO.syncIO((x) => x + 1)
    const x = yield IO.syncIO((x) => x + 1)
    console.log('x', x)
    yield IO.syncIO((x) => x + 1)
    yield IO.asyncIO(async (x) => x + 'async')
    yield IO.syncIO((x) => x + 1)
  })
  x.to({ success: (x) => console.log('success', x), failure: () => {} })
  x.success(1000)
})

test('yeld* test', () => {
  const sub = IO.syncCode(function* () {
    yield IO.syncIO((x) => x + 1)
    yield IO.syncIO((x) => x + 1)
  })
  const root = IO.syncCode(function* () {
    yield IO.syncIO((x) => x + 1)
    const s = yield* sub
    yield IO.syncIO((x) => x + 1)
    console.log('s', s)
  })

  root.to({ success: (x) => console.log('success', x), failure: () => {} })
  root.success(500)
})
