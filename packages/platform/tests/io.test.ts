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
    yield syncIO((x) => x + 1)
    yield syncIO((x) => x + 1)
    const x = yield syncIO((x) => x + 1)
    console.log('x', x)
    yield syncIO((x) => x + 1)
    yield syncIO((x) => x + 1)
  })
  x.to({ success: (x) => console.log('success', x), failure: () => {} })
  x.success(100)
})
