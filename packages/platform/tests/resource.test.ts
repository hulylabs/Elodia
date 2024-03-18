//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'

import { $status } from '../src/platform'
import { Resources } from '../src/resource'
import { Result } from '../src/types'

test('Resources.plugin', () => {
  const plugin = Resources.plugin('plugin', (_) => ({
    class: {
      Object: _<{ x: string }>(),
      Class: _<string>(),
      Doc: _(),
    },
    status: {
      OK: _<string>((id) => id + '-OK'),
      ERROR: _($status<{ text: string }>(Result.ERROR)),
    },
    const: {
      N5: 5,
    },
  }))

  expect(plugin.class.Object as string).toBe('plugin:class:Object')
  expect(plugin.class.Class as string).toBe('plugin:class:Class')
  expect(plugin.class.Doc as string).toBe('plugin:class:Doc')
  expect(plugin.status.OK).toBe('plugin:status:OK-OK')
  expect(plugin.const.N5).toBe(5)

  const status = plugin.status.ERROR.create({ text: 'hello' })
  expect(status.id as string).toBe('plugin:status:ERROR')
  expect(status.params.text).toBe('hello')
})
