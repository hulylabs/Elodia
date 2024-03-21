//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/modules/i18n.ts
//

import { createResourceType, type ResourceId } from '../'

import IntlMessageFormat from 'intl-messageformat'

const type = 'i18n'

type IntlStringTypeId = typeof type
type Params = Record<string, string | number | boolean>
type IntlString<P extends Params> = ResourceId<IntlStringTypeId, P>

export type Locale = string & { __tag: 'locale' }

const translate = <P extends Params>(locale: Locale, message: string, params: P) =>
  new IntlMessageFormat(message, locale).format(params)

// const translate = <P extends Params>(i18n: IntlString<P>, params: P) => JSON.stringify({ i18n, params })

const i18nProvider = {
  type: createResourceType<IntlStringTypeId, Params>(type),
  factory:
    <P extends Params>() =>
    (i18n: IntlString<P>) =>
    (params: P) =>
      translate(i18n, params),
}

export function createI18n() {
  return {
    api: { translate },
    resources: { [type]: i18nProvider },
  }
}
