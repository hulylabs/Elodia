//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { PlatformError, Result, createPlatform, type Status, type StatusId } from './'
import { createIO, type IOConfiguration } from './modules/io'

export const configuration: IOConfiguration = {
  errorToStatus: (error: unknown): Status<any> => {
    if (error instanceof PlatformError) return error.status
    if (error instanceof Error)
      return {
        id: 'platform.status.UnknownError' as unknown as StatusId<{ message: string }>,
        result: Result.ERROR,
        params: { message: error.message },
      }
    throw error // not our business
  },
  defaultFailureHandler: (status: Status<any>): void => {
    console.error('unhandled status: ', status)
  },
}

export const platform = createPlatform().loadModule(createIO(configuration))
