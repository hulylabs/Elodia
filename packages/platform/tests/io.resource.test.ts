//
//   Huly® Platform™ Core • platform/io.resource.test.ts
//   Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// © 2024 Hardcore Engineering Inc. All Rights Reserved.
//

import { expect } from 'bun:test'

import { createIO, type IOConfiguration } from '../src/io'
import { createLocale, createPlatform } from '../src/platform'
import { type Status } from '../src/status'
import { expectIO } from './util'

const conf: IOConfiguration = {
  errorToStatus: (error: unknown): Status<any> => {
    throw error // not our business
  },
  defaultFailureHandler: (status: Status<any>): void => {
    console.error('unhandled status: ', status)
  },
}

const platform = createPlatform(createLocale('en'), { out: console.log, err: console.error }).loadModule(createIO(conf))

const io1 = platform.api().success(111)

const resources = platform.plugin('test', (_) => ({
  io: {
    IO1: _.io(io1),
  },
}))

expectIO(resources.io.IO1(), (value) => expect(value).toBe(111))
