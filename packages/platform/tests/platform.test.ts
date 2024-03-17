//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'

import { Console } from '../src/console'
import { IO } from '../src/io'
import { Platform, platform } from '../src/platform'

test('console', () => {
  const io = IO.syncIO((x) => x)
  Console.log(io)
  io.success('x')
})

test('i18n', () => {
  const x = Platform.translate(platform.string.CopyrightMessage, { year: '2024' })
  Console.log(x)
})
