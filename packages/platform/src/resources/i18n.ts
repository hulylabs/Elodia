//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/resources/i18n.ts
//

import { createResourceType, type ResourceId } from '../modules/resource'

type IntlStringTypeId = 'i18n'
type Params = Record<string, string | number | boolean>
export type IntlString<P extends Params> = ResourceId<IntlStringTypeId, P>

const translate = <P extends Params>(i18n: IntlString<P>, params: P) => JSON.stringify({ i18n, params })

export const i18nProvider = {
  type: createResourceType<Params, IntlStringTypeId>('i18n'),
  factory:
    <P extends Params>() =>
    (i18n: IntlString<P>) =>
    (params: P) =>
      translate(i18n, params),
}
