//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/resources/i18n.ts
//

import type { Resource, ResourceType } from '../resource'

type IntlResourceTypeId = 'i18n'

export type Primitive = string | number | boolean
export type Params = Record<string, Primitive>

export type IntlStringType<P extends Params> = ResourceType<IntlResourceTypeId, P>
export type IntlString<P extends Params> = Resource<IntlResourceTypeId, P>

const translate = <P extends Params>(i18n: IntlString<P>, params: P): string => i18n.key + JSON.stringify(params)

type IntlStringConstructor<P extends Params> = {
  __resourceType_type: P // "virtual" field to save type information
  constructor: (i18n: IntlString<P>) => (params: P) => string
}

const intlStringConstructorFactory = <P extends Params>(): IntlStringConstructor<P> => ({
  __resourceType_type: {} as P, // "virtual" field to save type information
  constructor: (i18n: IntlString<P>) => (params: P) => translate(i18n, params),
})

type IntlStringContructors = Record<string, IntlStringConstructor<any>>
type IntlStringResources<C extends IntlStringContructors> = {
  [K in keyof C]: C[K] extends IntlStringConstructor<infer P> ? IntlString<P> : never
}

const intlStringTypeProvider = {
  helpers: {
    i18n: intlStringConstructorFactory,
  },
}

const i18n = intlStringTypeProvider.helpers.i18n

const res = {
  Test: i18n<{ x: number }>(),
}

const constructIt = <C extends IntlStringContructors>(x: C): IntlStringResources<C> =>
  Object.keys(x).reduce(
    (acc, key) => ({
      ...acc,
      [key]: {} as IntlString<{}>,
    }),
    {},
  ) as IntlStringResources<C>

const constr = constructIt(res)

const test = constr.Test
