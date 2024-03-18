//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/platform.test.ts
//

import { expect, test } from 'bun:test'

import { Resources } from '../src'
import { pipe, success } from '../src/io'
import { Platform, TestPackage, platform } from '../src/platform'
import type { Locale, PluginId } from '../src/resource'
import { expectIO } from './util'

import platorm_en from '../lang/en.json'

test('messageFormat', () => {
  const { messageFormatIO } = TestPackage

  expectIO(
    pipe(
      success({
        CopyrightMessage:
          '© 2024 Hardcore Engineering, Inc. All Rights Reserved. Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).',
      }),
      messageFormatIO('en', platform.string.CopyrightMessage),
    ),
    (value) => {
      expect(value).toBe(
        '© 2024 Hardcore Engineering, Inc. All Rights Reserved. Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).',
      )
    },
  )
})

test('get platform en strings', () => {
  expectIO(
    pipe(success('en' as Locale), Resources.getPlugin('platform' as PluginId).$.getLocalizedStrings()),
    (value) => {
      expect(value).toEqual(platorm_en)
    },
  )
})

test('translate', () => {
  expectIO(Platform.translate(platform.string.CopyrightMessage, { year: '2024' }), (translate) => {
    expect(translate).toBe('© 2024 Hardcore Engineering, Inc. All Rights Reserved.')
  })
})
