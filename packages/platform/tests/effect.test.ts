//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'

import { Effects } from '../src/effect'
import { $status } from '../src/platform'
import { Resources } from '../src/resource'
import { Result } from '../src/types'

// const plugin = Resources.plugin('plugin', (_) => ({
//   status: {
//     Error: _($status<{ text: string }>(Result.ERROR)),
//   },
// }))

// test('Effects.success', () => {
//   Effects.success(42).then((value) => {
//     expect(value).toBe(42)
//   })
// })

// test('Effects.syncCode / success', () => {
//   Effects.syncCode(function* (_) {
//     const effect = Effects.success('hello')
//     const prog = _(effect)
//     const hello = yield* prog
//     expect(hello).toBe('hello')
//     return 5
//   }).then((value) => {
//     console.log('value', value)
//     expect(value).toBe(5)
//   })
// })

// test('Effects.syncCode / failure', () => {
//   const effect = Effects.syncCode(function* (_) {
//     const status = plugin.status.Error.create({ text: 'hello' })
//     console.log('status', status)
//     // const effect = Effects.failure(status)
//     // yield* _(effect)
//     return 'hey there!'
//   })

//   effect.then(
//     () => {
//       expect(2 + 2).toBe(5)
//     },
//     (s) => {
//       const status = plugin.status.Error.cast(s)
//       expect(status.id).toBe(plugin.status.Error.id)
//       expect(status.params.text).toBe('hello')
//       expect(status.result).toBe(Result.ERROR)
//     },
//   )
// })

// const promise = Promise.resolve(42)

// console.log('promise', promise)

// test('Effects.syncCode / success', () => {
//   Effects.syncCode(async function* (_) {
//     return await promise
//   }).then((value) => {
//     expect(value).toBe('hey there!')
//   })
// })
