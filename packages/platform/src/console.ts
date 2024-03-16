//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { Platform } from './platform'

interface Console {
  // debug(message: string): void

  info(...args: ReadonlyArray<any>): Effect<void>

  // warn<P extends Params>(message: IntlString<P>, params: P): Value<void>
  // terminates the fiber
  // error<P extends Params>(status: Status<P>): Value<void, Status<P>>
}

export const Console: Console = {
  info: (...args: ReadonlyArray<any>) =>
    Platform.runSync(() => {
      console.log(...args)
    }),
}
