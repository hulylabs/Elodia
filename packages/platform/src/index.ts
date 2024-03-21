/**
 * © 2024 Hardcore Engineering, Inc. All Rights Reserved.
 * Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
 *
 * · Huly Platform
 */

import { createIO, type IOConfiguration } from './io'
import { createLocale, createPlatform, type Locale } from './platform'
import { PlatformError, Result, createStatusPlugin, type Status } from './status'
import { wrap, type StdIO } from './util'

export const platform = (locale: Locale, stdio: StdIO) => {
  const std = wrap(stdio)

  const statusResourcesId = 'platform/status'
  const bootStatus = createPlatform(locale, std).loadModule(createStatusPlugin())
  const statusResources = bootStatus.plugin(statusResourcesId, (_) => ({
    status: {
      UnknownError: _.status<{ message: string }>(Result.ERROR),
    },
  }))

  const io: IOConfiguration = {
    errorToStatus: (error: unknown): Status<any> => {
      if (error instanceof PlatformError) return error.status
      if (error instanceof Error) return statusResources.status.UnknownError({ message: error.message })
      throw error // not our business
    },
    defaultFailureHandler: (status: Status<any>): void => {
      std.err(status.toString())
    },
  }

  const bootIO = bootStatus.loadModule(createIO(io))

  return bootIO
}

export const x = platform(createLocale('en'), { out: console.log, err: console.error })
