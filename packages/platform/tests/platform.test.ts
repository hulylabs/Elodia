//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'

import { Resources, type IntlString } from '../src'
import { Console } from '../src/console'
import { Platform, TestPackage, platform } from '../src/platform'

test('console', () => {
  const io = Platform.IO.syncIO((x) => x)
  Console.log(io)
  io.success('x')
})

test('messageFormat', () => {
  const { messageFormat } = TestPackage

  const format1 = messageFormat('en', 'nonsence' as IntlString, undefined)
  Console.log(format1)
  format1.success({})

  const format2 = messageFormat('en', 'platform:string:CopyrightMessage' as IntlString, undefined)
  Console.log(format2)
  format2.success({
    CopyrightMessage:
      '© 2024 Hardcore Engineering, Inc. All Rights Reserved. Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).',
  })
})

test('getLocale', () => {
  const { getLocale } = TestPackage

  const locale1 = getLocale('platform' as any, 'en')
  Console.log(locale1)
})

test('translate', () => {
  const translate1 = Platform.translate('platform:string:CopyrightMessage' as IntlString, undefined)
  Console.log(translate1)
})
