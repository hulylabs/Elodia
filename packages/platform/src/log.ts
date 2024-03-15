//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import type { IntlString, Params } from './types'

export interface Log {
  debug<P extends Params>(message: IntlString<P>, params: P): void
  info<P extends Params>(message: IntlString<P>, params: P): void
  warn<P extends Params>(message: IntlString<P>, params: P): void
  // terminates the fiber
  error<P extends Params>(message: IntlString<P>, params: P): void
}
