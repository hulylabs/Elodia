/**
 * © 2024 Hardcore Engineering, Inc. All Rights Reserved.
 * Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
 *
 * Huly Platform Package.
 */

import { Console } from './console'
import { Platform } from './platform'

interface XYZ {
  tx: string
}

export const platform = Platform.plugin('platform', (ident) => ({
  class: {
    Object: ident.external<XYZ>(),
    Class: ident.internal('trx'),
  },
  status: {
    // OK: Platform.success(() => newStatus(Result.OK)),
  },
  const: {
    N55: 5,
    N42: Platform.success(42),
  },
  service: {
    Console: Platform.success(Console),
  },
}))

const x = platform.class.Object
const y = platform.class.Class
const z = platform.const.N55
const w = platform.const.N42

console.log(x)
console.log(y)
console.log(z)
console.log(w)

const prog = Platform.syncCode(function* (_) {
  const value = yield* _(Platform.success(42))
  console.log('inside program', value)
  // const console = yield* _(platform.service.Console)
  // console.info('inside program', value)
  return 55
})

// prog.then(console.log)
// platform.const.N42

console.log(prog)

console.log(Platform.runSync(prog))
