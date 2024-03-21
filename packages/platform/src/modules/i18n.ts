//
//   Huly® Platform™ Core • platform/i18n.ts
//   Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// © 2024 Hardcore Engineering Inc. All Rights Reserved.
//

import { createResourceType, type Locale, type Platform, type ResourceId } from '../platform'

import IntlMessageFormat from 'intl-messageformat'

const type = 'i18n'

type IntlStringTypeId = typeof type
type Params = Record<string, string | number | boolean>
type IntlString<P extends Params> = ResourceId<IntlStringTypeId, P>

const translate = <P extends Params>(locale: Locale, message: string, params: P) =>
  new IntlMessageFormat(message, locale.language).format(params)

const translateResource = <P extends Params>(locale: Locale, resource: IntlString<P>, params: P) =>
  //new IntlMessageFormat(message, locale).format(params)
  'hey'

const i18nProvider = {
  type: createResourceType<IntlStringTypeId, Params>(type),
  factory:
    <P extends Params>() =>
    (i18n: IntlString<P>, platform: Platform<any, any>) =>
    (params: P) =>
      translateResource(platform.locale, i18n, params),
}

export function createI18n() {
  return {
    id: type,
    api: { translate },
    resources: { [type]: i18nProvider },
  }
}
