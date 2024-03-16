//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { Resources } from './resource'
import type { Params, Status } from './types'
import { $status, PlatformError, Result } from './types'

export const platform = Resources.plugin('platform', (_) => ({
  status: {
    UnknownError: _.factory($status<{ message: string }>(Result.ERROR)),
  },
}))

export function getStatus<M extends Params, P extends M>(error: Error) {
  if (error instanceof PlatformError) {
    return error.status as Status<M, P>
  }
  return platform.status.UnknownError({ message: error.message })
}
