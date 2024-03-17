//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { chain, type Out } from './io'

interface ConsoleIO {
  log<T>(x: Out<T>): Out<T>
}

export const Console: ConsoleIO = {
  log: <T,>(out: Out<T>): Out<T> =>
    chain(out, (value: T) => {
      console.log(value)
      return value
    }),
}
