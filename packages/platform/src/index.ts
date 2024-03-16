/**
 * © 2024 Hardcore Engineering, Inc. All Rights Reserved.
 * Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
 *
 * Huly Platform Package.
 */

import { Console } from './console'
import { Platform } from './platform'
import { newStatus, Result } from './types'

export const platform = Platform.plugin('platform', {
  status: {
    OK: Platform.success(() => newStatus(Result.OK)),
  },
  const: {
    N42: Platform.success(42),
  },
  service: {
    Console: Platform.success(Console),
  },
})

const prog = Platform.syncCode(function* (_) {
  const value = yield* _(Platform.success(42))
  console.log('inside program', value)
  // const console = yield platform.service.Console
  // console.info('inside program', value)
  return 55
})

prog.then(console.log)
platform.const.N42.then(console.log)

console.log(prog)
