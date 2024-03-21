//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/resource.test.ts
//

import { expect, test } from 'bun:test'

import { createPlatform, createResourceType, type ResourceId } from '../src/'

type XResourceTypeId = 'xtest'

type Primitive = string | number | boolean
type Params = Record<string, Primitive>

type IntlString<P extends Params> = ResourceId<XResourceTypeId, P>

const xtest = createResourceType<XResourceTypeId, Params>('xtest')

const translate = <P extends Params>(i18n: IntlString<P>, params: P): string =>
  i18n.pluginId + '-' + i18n.type.id + '-' + i18n.key + '-' + JSON.stringify(params)

const resourceProvider = {
  type: xtest,
  factory:
    <P extends Params>() =>
    (i18n: IntlString<P>) =>
    (params: P) =>
      translate(i18n, params),
}

const platform = createPlatform().loadModule({
  api: {},
  resources: {
    xtest: resourceProvider,
  },
})

const plugin = platform.plugin('myplugin', (factories) => ({
  xtest: {
    Key1: factories.xtest<{ year: 2024 }>(),
  },
}))

test('resource', () => {
  expect(plugin.xtest.Key1({ year: 2024 })).toBe('myplugin-xtest-Key1-{"year":2024}')
})
