//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'

import { Console } from '../src/console'
import { Platform } from '../src/platform'

const { IO } = Platform

test('message sent after', () => {
  const io = IO.syncIO((x) => x)
  io.success('hello world, console')
  Console.log(io)
})

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
  x.pipe({ success: (x) => console.log('success', x), failure: () => {} })
  x.success(100)
})

test('async io', () => {
  const io = IO.asyncIO(async (x: number) => x + 1)
  io.pipe({ success: (x) => console.log('success', x), failure: () => {} })
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
  x.pipe({ success: (x) => console.log('success', x), failure: () => {} })
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
  x.pipe({ success: (x) => console.log('success', x), failure: () => {} })
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

  root.pipe({ success: (x) => console.log('success', x), failure: () => {} })
  root.success(500)
})
