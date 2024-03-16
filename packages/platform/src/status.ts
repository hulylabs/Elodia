//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import type { IntlString, Params, ResourceId, Status } from './types'
import { Result } from './types'

export const $status =
  <M extends Params = void, P extends M = M>(result: Result, message?: IntlString<M>) =>
  (id: ResourceId<(params: P) => Status<M, P>>) =>
  (params: P) => ({ id, params, result, message })
