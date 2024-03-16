//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'

import { Resources } from '../src/resource'
import { $status, Result } from '../src/types'

test('Resources.plugin', () => {
  const plugin = Resources.plugin('plugin', (_) => ({
    class: {
      Object: _.id<{ x: string }>(),
      Class: _.id('Class'),
    },
    status: {
      OK: _.factory((id) => id + '-OK'),
      ERROR: _.factory($status<{ text: string }>(Result.ERROR)),
    },
    const: {
      N5: 5,
    },
  }))
  expect(plugin.class.Object as string).toEqual('plugin:class:Object')
  expect(plugin.class.Class as string).toEqual('plugin:class:Class')
  expect(plugin.status.OK).toEqual('plugin:status:OK-OK')
  expect(plugin.const.N5).toEqual(5)

  const status = plugin.status.ERROR.create({ text: 'hello' })
  expect(status.id as string).toEqual('plugin:status:ERROR')
  expect(status.params.text).toEqual('hello')
})
