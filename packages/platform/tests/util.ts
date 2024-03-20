//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/tests/utils.ts
//

import { expect } from 'bun:test'

import { PlatformError, type PlatformConfiguration } from '../src/'
import type { Out } from '../src/modules/io'
import { Result, type Status, type StatusId } from '../src/resources/status'

export const expectIO = <T,>(io: Out<T>, validate: (value: T) => void): void => {
  io.pipe({
    success: (value) => validate(value),
    failure: (status) => {
      console.log('expectIO (failure):', status)
      expect(false).toBe(true)
    },
  })
}

export const configuration: PlatformConfiguration = {
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
