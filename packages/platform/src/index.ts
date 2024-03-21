/**
 * © 2024 Hardcore Engineering, Inc. All Rights Reserved.
 * Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
 *
 * · Huly Platform
 */

import { createIO, type IOConfiguration } from './io'
import { createPlatform, type Locale } from './platform'
import { PlatformError, Result, createStatusPlugin, type Status } from './status'

export const platform = (locale: Locale) => {
  const bootStatus = createPlatform(locale).loadModule(createStatusPlugin())

  const statusResources = bootStatus.plugin('boot_status', (_) => ({
    status: {
      UnknownError: _.status<{ message: string }>(Result.ERROR),
    },
  }))

  const io: IOConfiguration = {
    errorToStatus: (error: unknown): Status<any> => {
      if (error instanceof PlatformError) return error.status
      if (error instanceof Error) return statusResources.status.UnknownError.create({ message: error.message })
      throw error // not our business
    },
    defaultFailureHandler: (status: Status<any>): void => {
      console.error('unhandled status: ', status)
    },
  }

  const bootIO = bootStatus.loadModule(createIO(io))

  return bootIO
}
