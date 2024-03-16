//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'

import { Effects } from '../src/effect'

test('Effects.success', () => {
  Effects.success(42).then((value) => {
    expect(value).toEqual(42)
  })
})

test('Effects.syncCode', () => {
  Effects.syncCode(function* (_) {
    return 'hello'
  }).then((value) => {
    expect(value).toEqual('hello')
  })
})
