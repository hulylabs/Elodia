//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import type { IntlString, OptParams } from './types'

export interface Log {
  debug<P extends OptParams>(message: IntlString<P>, params: P): void
  info<P extends OptParams>(message: IntlString<P>, params: P): void
  warn<P extends OptParams>(message: IntlString<P>, params: P): void
  // terminates the fiber
  error<P extends OptParams>(message: IntlString<P>, params: P): void
}
