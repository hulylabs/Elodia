//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'

import { Console } from '../src/console'
import { syncIO } from '../src/io'

test('io', () => {
  const io = syncIO(() => 42)
  Console.log(io)
  io.success(55)
})
