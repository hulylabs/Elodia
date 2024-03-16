//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import type { IntlString, Params, ResourceId, Status } from './types'
import { Result } from './types'

const createStatusFactoryFactory =
  <P extends Params>(result: Result, message?: IntlString<P>) =>
  (id: ResourceId<(params: P) => Status<P>>) =>
  (params: P) => ({ id, params, result, message })

export { createStatusFactoryFactory as $status }
