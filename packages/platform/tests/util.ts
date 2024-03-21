//
//   Huly® Platform™ Core • platform/util.ts
//   Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// © 2024 Hardcore Engineering Inc. All Rights Reserved.
//

import { expect } from 'bun:test'

import type { Out } from '../src/io'

export const expectIO = <T,>(io: Out<T>, validate: (value: T) => void): void => {
  io.pipe({
    success: (value) => validate(value),
    failure: (status) => {
      console.log('expectIO (failure):', status)
      expect(false).toBe(true)
    },
  })
}
