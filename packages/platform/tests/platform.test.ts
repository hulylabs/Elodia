//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'

import { Resources, type IntlString } from '../src'
import { Platform, TestPackage, platform } from '../src/platform'
import type { Locale, PluginId } from '../src/resource'
import { expectIO } from './util'

import platorm_en from '../lang/en.json'

test('messageFormat', () => {
  const { messageFormatIO } = TestPackage

  expectIO(
    messageFormatIO('en', platform.string.CopyrightMessage).success({
      CopyrightMessage:
        '© 2024 Hardcore Engineering, Inc. All Rights Reserved. Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).',
    }),
    (value) => {
      expect(value).toBe(
        '© 2024 Hardcore Engineering, Inc. All Rights Reserved. Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).',
      )
    },
  )
})

test('get platform en strings', () => {
  expectIO(
    Resources.getPlugin('platform' as PluginId)
      .$.getLocalizedStrings()
      .success('en' as Locale),
    (value) => {
      expect(value).toEqual(platorm_en)
    },
  )
})

test('translate', () => {
  expectIO(Platform.translate(platform.string.CopyrightMessage), (translate) => {
    expect(translate).toBe('Author 1')
  })
})
