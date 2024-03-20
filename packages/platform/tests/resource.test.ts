//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/resource.test.ts
//

import { expect, test } from 'bun:test'

import { createPlatform } from '../src/'
import { createResourceType, type ResourceId, type ResourceProvider } from '../src/modules/resource'

type XResourceTypeId = 'xresource'

type Primitive = string | number | boolean
type Params = Record<string, Primitive>

type IntlString<P extends Params> = ResourceId<XResourceTypeId, P>

const translate = <P extends Params>(i18n: IntlString<P>, params: P): string =>
  i18n.pluginId + '-' + i18n.type.id + '-' + i18n.key + '-' + JSON.stringify(params)

const IntlStringResourceProvider: ResourceProvider<XResourceTypeId, Params, any> = {
  type: createResourceType<Params, XResourceTypeId>('xresource'),
  factory:
    <P extends Params>() =>
    (i18n: IntlString<P>) =>
    (params: P) =>
      translate(i18n, params),
}

const platform = createPlatform().addResourceProvider(IntlStringResourceProvider)

const plugin = platform.plugin('myplugin', (_) => ({
  xresource: {
    Key1: _.xresource<{ year: number }>(),
  },
}))

test('resource', () => {
  expect(plugin.xresource.Key1({ year: 2024 })).toBe('myplugin-xresource-Key1-{"year":2024}')
})
