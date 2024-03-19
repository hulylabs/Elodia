//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/resources/i18n.ts
//

import { createResourceType, type ResourceId } from '../resource'

type IntlStringTypeId = 'i18n'

type Primitive = string | number | boolean
type Params = Record<string, Primitive>

type IntlString<P extends Params> = ResourceId<IntlStringTypeId, P>

const translate = <P extends Params>(i18n: IntlString<P>, params: P) => JSON.stringify({ i18n, params })

export const IntlStringProvider = {
  type: createResourceType<Params, IntlStringTypeId>('i18n'),
  factory:
    <P extends Params>() =>
    (i18n: IntlString<P>) =>
    (params: P) =>
      translate(i18n, params),
}
