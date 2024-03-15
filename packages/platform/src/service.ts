//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import type { IntlString, Params, Status, Value } from './types'

export interface Logger {
  debug(message: string): void

  info<P extends Params>(message: IntlString<P>, params: P): Value<void>
  warn<P extends Params>(message: IntlString<P>, params: P): Value<void>
  // terminates the fiber
  error<P extends Params>(status: Status<P>): Value<void, Status<P>>
}

export interface I18n {
  translate<P extends Params>(message: IntlString<P>, params: P): Value<string>
}
