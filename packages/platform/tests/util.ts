//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/tests/utils.ts
//

import { expect } from 'bun:test'

import { PlatformError } from '../src/'
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
