/**
 * © 2024 Hardcore Engineering, Inc. All Rights Reserved.
 * Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
 *
 * Huly Platform Package.
 */

import { Console } from './console'
import { Effects } from './effect'
import { Resources, type Resource } from './resource'

interface XYZ {
  tx: string
}

export const platform = Resources.plugin('platform', (ident) => ({
  class: {
    Object: ident.external<XYZ>(),
    Class: ident.internal('trx'),
  },
  status: {
    OK: ident.factory((id) => id + 'OK'),
  },
  const: {
    N55: 5,
    N42: Effects.success(42),
  },
  service: {
    Console: Effects.success(Console),
  },
}))

const x = platform.class.Object
const y = platform.class.Class
const z = platform.const.N55
const w = platform.const.N42
const v = platform.status.OK

console.log(x)
console.log(y)
console.log(z)
console.log(w)
console.log(v)

const prog = Effects.syncCode(function* (_) {
  const value = yield* _(Effects.success(42))
  console.log('inside program', value)
  // const console = yield* _(platform.service.Console)
  // console.info('inside program', value)
  return 55
})

// prog.then(console.log)
// platform.const.N42

console.log(prog)

console.log(Effects.runSync(prog))
