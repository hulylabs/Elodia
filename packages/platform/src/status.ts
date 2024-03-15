//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { makePRI } from './ident'
import { addResourceResolver } from './resource'
import type {
  IntlString,
  PRI,
  Params,
  Plugin,
  ResourceKind,
  Status,
  StatusFunc,
} from './types'
import { Severity } from './types'

class StatusObject<P extends Params> implements Status<P> {
  readonly severity: Severity
  readonly code: PRI
  readonly params: P
  readonly i18n: IntlString<P> = '' as IntlString<P>

  constructor(severity: Severity, code: PRI, params: P) {
    this.severity = severity
    this.code = code
    this.params = params
  }
}

function statusResolver<P extends Params>(
  plugin: Plugin,
  category: ResourceKind,
  name: string,
  value: StatusFunc<P>,
): (params: P) => Status<P> {
  return (params: P): Status<P> =>
    new StatusObject<P>(value, makePRI(plugin, category, name), params)
}

addResourceResolver('status' as ResourceKind, statusResolver)

// const x = resources('x' as Plugin, {
//   status: {
//     X: $status<{ x: number }>(Severity.Error)
//   }
// })

// x.status.X
