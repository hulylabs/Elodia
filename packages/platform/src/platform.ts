//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { failure, runSync, success, sync, syncCode } from './effect'
import { plugin } from './resource'

export const Platform = Object.freeze({
  syncCode,
  sync,
  success,
  failure,
  runSync,
  plugin,
})
