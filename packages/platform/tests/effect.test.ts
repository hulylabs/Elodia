//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'

import { Effects } from '../src/effect'
import { $status } from '../src/platform'
import { Resources } from '../src/resource'
import { Result } from '../src/types'

const plugin = Resources.plugin('plugin', (_) => ({
  status: {
    Error: _($status<{ text: string }>(Result.ERROR)),
  },
}))

test('Effects.success', () => {
  Effects.success(42).then((value) => {
    expect(value).toBe(42)
  })
})

test('Effects.syncCode / success', () => {
  Effects.syncCode(function* (_) {
    const hello = yield* _(Effects.success('hello'))
    expect(hello).toBe('hello')
    return 'hey there!'
  }).then((value) => {
    expect(value).toBe('hey there!')
  })
})

test('Effects.syncCode / failure', () => {
  const effect = Effects.syncCode(function* (_) {
    const status = plugin.status.Error.create({ text: 'hello' })
    const effect = Effects.failure(status)
    yield* _(effect)
    return 'hey there!'
  })

  effect.then(
    (value) => {
      expect(value).toBe('hey there!')
    },
    (s) => {
      const status = plugin.status.Error.cast(s)
      expect(status.id).toBe(plugin.status.Error.id)
      expect(status.params.text).toBe('hello')
      expect(status.result).toBe(Result.ERROR)
    },
  )
})
