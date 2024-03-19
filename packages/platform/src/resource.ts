//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/resource.ts
//

import { mapObjects } from './util'

// R E S O U R C E  M A N A G E M E N T

export type PluginId = string & { __tag: 'plugin-id' }
export type ResourceTypeId<I extends string> = I & { __tag: 'resource-type-id' }
type ResourceType<I extends string, T> = {
  id: ResourceTypeId<I>
  __type: T // virtual field to help with type inference
}

export type ResourceId<I extends string, T> = {
  pluginId: PluginId
  type: ResourceType<I, T>
  key: string
}

type ResourceConstructor<I extends string, T, R> = (resource: ResourceId<I, T>) => R
type AnyResourceConstructor = ResourceConstructor<any, any, any>
type ResourceConstructors = Record<string, AnyResourceConstructor>

export const createResourceType = <T, I extends string>(id: I): ResourceType<I, T> => ({ id }) as ResourceType<I, T>

// P R O V I D E R

type ResourceConstructorFactory<I extends string, T, R> = (...args: any[]) => ResourceConstructor<I, T, R>

export interface ResourceProvider<I extends string, T, F extends ResourceConstructorFactory<I, T, any>> {
  type: ResourceType<I, T>
  factory: F
}
type AnyResourceProvider = ResourceProvider<string, any, any>

// P L U G I N

interface PluginResourceConstructors {
  [key: string]: ResourceConstructors
}

type InferredResources<P extends PluginResourceConstructors> = {
  [PluginKey in keyof P]: {
    [ResourceKey in keyof P[PluginKey]]: P[PluginKey][ResourceKey] extends AnyResourceConstructor
      ? ReturnType<P[PluginKey][ResourceKey]>
      : never
  }
}

const createResources = <P extends PluginResourceConstructors, T extends AnyResourceProvider[]>(
  providers: T,
  pluginId: PluginId,
  pluginConstructors: P,
): InferredResources<P> =>
  providers.reduce((acc, { type }) => {
    acc[type.id] = mapObjects(pluginConstructors[type.id], (constructor, key) => constructor({ pluginId, type, key }))
    return acc
  }, {} as any)

// P L A T F O R M

type InferredHelpers<P extends AnyResourceProvider[]> = {
  [K in keyof P]: P[K] extends ResourceProvider<infer I, any, infer F> ? { [key in I]: F } : never
}[number]

export const createPlatform = <P extends AnyResourceProvider[]>(providers: [...P]) => {
  const helper = Object.fromEntries(providers.map((provider) => [provider.type.id, provider.factory])) as {
    [K in keyof InferredHelpers<P>]: InferredHelpers<P>[K]
  }

  return {
    plugin: <T extends PluginResourceConstructors>(name: string, template: (_: typeof helper) => T) => ({
      ...createResources<T, P>(providers, name as PluginId, template(helper)),
      id: name as PluginId,
    }),
  }
}

// E X A M P L E

type IntlResourceTypeId = 'i18n'

type Primitive = string | number | boolean
type Params = Record<string, Primitive>

type IntlString<P extends Params> = ResourceId<IntlResourceTypeId, P>

const translate = <P extends Params>(i18n: IntlString<P>, params: P): string => i18n.key + JSON.stringify(params)

const IntlStringResourceProvider = {
  type: createResourceType<Params, 'i18n'>('i18n'),
  factory:
    <P extends Params>() =>
    (i18n: IntlString<P>) =>
    (params: P) =>
      translate(i18n, params),
}

const platform = createPlatform([IntlStringResourceProvider])

const plugin = platform.plugin('my-plugin', (_) => ({
  i18n: {
    X: _.i18n(),
  },
}))

console.log(plugin.i18n.X({ a: 1 }))
