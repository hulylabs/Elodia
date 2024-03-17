//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'

import { Console } from '../src/console'
import { syncCode, syncIO } from '../src/io'

// test('io', () => {
//   const io = syncIO(() => 'The answer is 42')
//   Console.log(io)
//   io.success(55)
// })

test('code', () => {
  console.log('code')
  const x = syncCode(function* () {
    yield syncIO(() => 'The answer is 42')
    const m = yield syncIO((x) => {
      console.log(x)
      return 88
    })
    console.log('m', m)
    yield syncIO((x) => {
      console.log(x)
      return 55
    })
    yield syncIO((x) => {
      console.log(x)
      return 33
    })
    yield syncIO((x) => {
      console.log(x)
      return 77
    })
  })
  x.success(55)
})
