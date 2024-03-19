//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/resource.ts
//

// R E S O U R C E  M A N A G E M E N T

export type PluginId = string & { __tag: 'plugin-id' }
export type ResourceTypeId<I extends string> = I & { __tag: 'resource-type-id' }
export type ResourceType<I extends string, T> = {
  id: ResourceTypeId<I>
  type: T
}

export type Resource<I extends string, T> = {
  pluginId: PluginId
  resourceType: ResourceType<I, T>
  key: string
}

interface ResourceConstructor<I extends string, T> {
  __resourceType_type: T // "virtual" field to save type information
  constructor: (resource: Resource<I, T>) => (...args: any[]) => any
}
type ResourceContructors = Record<string, ResourceConstructor<any, any>>
type Resources<C extends ResourceContructors> = {
  [K in keyof C]: C[K] extends ResourceConstructor<infer I, infer T> ? Resource<I, T> : never
}

type ResourceConstructorFactory<I extends string, T> = (...args: any[]) => ResourceConstructor<I, T>
type ResourceConstructorFactories = Record<string, ResourceConstructorFactory<any, any>>

export interface ResourceProvider<F extends ResourceConstructorFactories> {
  factories: F
}

// R E S O U R C E  P R O V I D E R

export function createResourceProvider<F extends ResourceConstructorFactories>(factories: F): ResourceProvider<F> {
  return {
    factories,
  }
}

// TEST


type IntlResourceTypeId = 'i18n'

type Primitive = string | number | boolean
type Params = Record<string, Primitive>

type IntlStringType<P extends Params> = ResourceType<IntlResourceTypeId, P>
type IntlString<P extends Params> = Resource<IntlResourceTypeId, P>

const translate = <P extends Params>(i18n: IntlString<P>, params: P): string => i18n.key + JSON.stringify(params)
const i18n = <P(i18n: IntlString<P>) => (params: P) => translate(i18n, params)
