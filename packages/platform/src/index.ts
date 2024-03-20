/**
 * © 2024 Hardcore Engineering, Inc. All Rights Reserved.
 * Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
 *
 * Huly Platform Effects & Resources
 */

import { createIO, type IOConfiguration } from './modules/io'
import { createResource, type AnyResourceProvider } from './modules/resource'

import { i18nProvider } from './resources/i18n'
import { statusProvider, type Params, type Status } from './resources/status'

export class PlatformError<M extends Params, P extends M> extends Error {
  readonly status: Status<M, P>

  constructor(status: Status<M, P>) {
    super()
    this.status = status
  }
}

export interface PlatformConfiguration extends IOConfiguration {}

function createPlatform(configuration: PlatformConfiguration, providers: AnyResourceProvider[]) {
  return {
    IO: createIO(configuration),
    plugin: createResource(providers),
  }
}

const configuration: PlatformConfiguration = {
  errorToStatus: (error: unknown): Status<any> => {
    if (error instanceof PlatformError) return error.status
    // if (error instanceof Error) return platform.status.UnknownError.create({ message: error.message })
    throw error // not our business
  },
  defaultFailureHandler: (status: Status<any>): void => {
    console.error('unhandled status: ', status)
  },
}

export const Platform = createPlatform(configuration, [i18nProvider, statusProvider])
