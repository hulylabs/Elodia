//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'

import { Effects } from '../src/effect'
import { Resources } from '../src/resource'
import { $status, Result } from '../src/types'

const plugin = Resources.plugin('plugin', (_) => ({
  status: {
    Error: _.factory($status<{ text: string }>(Result.ERROR)),
  },
}))

test('Effects.success', () => {
  Effects.success(42).then((value) => {
    expect(value).toEqual(42)
  })
})

test('Effects.syncCode / success', () => {
  Effects.syncCode(function* (_) {
    const hello = yield* _(Effects.success('hello'))
    expect(hello).toEqual('hello')
    return 'hey there!'
  }).then((value) => {
    expect(value).toEqual('hey there!')
  })
})

test('Effects.syncCode / failure', () => {
  Effects.syncCode(function* (_) {
    const status = plugin.status.Error({ text: 'hello' })
    yield* _(Effects.failure(status))
    return 'hey there!'
  }).then(
    (value) => {
      console.log('THEN')
      expect(value).toEqual('hey there!')
    },
    (status) => {
      expect(status.id as string).toEqual('plugin:status:Error') // TODO: preserve id
      // expect(status.params.text).toEqual('hello') // TODO: status cast
      expect(status.result).toEqual(Result.ERROR)
    },
  )
})
