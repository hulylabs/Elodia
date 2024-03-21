/**
 * © 2024 Hardcore Engineering, Inc. All Rights Reserved.
 * Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
 *
 * · Huly Platform
 */

import { createIO, type IOConfiguration } from './io'
import { createLocale, createPlatform, type Locale } from './platform'
import { PlatformError, Result, createStatusPlugin, type Status } from './status'

const name = 'huly'
const version = '1.0'

export const platform = (locale: Locale) => {
  const out = (message: string) => console.log(`[${name}-${version}]: ${message}`)
  const err = (message: string) => console.error(`[${name}-${version}]: ${message}`)

  out(`booting platform version ${version} (https://huly.dev)`)

  const modStatus = 'platform/status'
  out(`loading \`${modStatus}\` module...`)

  const bootStatus = createPlatform(locale).loadModule(createStatusPlugin())
  const statusResources = bootStatus.plugin(modStatus, (_) => ({
    status: {
      UnknownError: _.status<{ message: string }>(Result.ERROR),
    },
  }))

  const modIO = 'platform/io'
  out(`loading \`${modIO}\` module...`)

  const io: IOConfiguration = {
    errorToStatus: (error: unknown): Status<any> => {
      if (error instanceof PlatformError) return error.status
      if (error instanceof Error) return statusResources.status.UnknownError({ message: error.message })
      throw error // not our business
    },
    defaultFailureHandler: (status: Status<any>): void => {
      err(status.toString())
    },
  }

  const bootIO = bootStatus.loadModule(createIO(io))

  return bootIO
}

export const x = platform(createLocale('en'))
