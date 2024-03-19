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
export type ResourceType<I extends string, T> = {
  id: ResourceTypeId<I>
  type: T
}

export type ResourceId<I extends string, T> = {
  pluginId: PluginId
  type: ResourceType<I, T>
  key: string
}

// type Resource<I extends string, T> = any & { __id: I; __type: T }

type ResourceConstructor<I extends string, T, R> = (resource: ResourceId<I, T>) => R
type AnyResourceConstructor = ResourceConstructor<any, any, any>
type ResourceConstructors = Record<string, AnyResourceConstructor>

// P R O V I D E R S

type ResourceConstructorFactory<I extends string, T, R> = (...args: any[]) => ResourceConstructor<I, T, R>
type ResourceConstructorFactories<I extends string, T> = Record<string, ResourceConstructorFactory<I, T, any>>

export interface ResourceProvider<I extends string, T, F extends ResourceConstructorFactories<I, T>> {
  type: ResourceType<I, T>
  factories: F
}
type AnyResourceProvider = ResourceProvider<any, any, any>

// P L U G I N  R E S O U R C E S

interface PluginResourceConstructors {
  [key: string]: ResourceConstructors
}

type InferredResource<R extends AnyResourceConstructor> = ReturnType<R>

type InferredResources<P extends PluginResourceConstructors> = {
  [K in keyof P]: P[K] extends Record<string, infer R>
    ? R extends AnyResourceConstructor
      ? InferredResource<R>
      : never
    : never
}

export const createResources = <P extends PluginResourceConstructors, T extends Array<AnyResourceProvider>>(
  providers: T,
  pluginId: PluginId,
  pluginConstructors: P,
): InferredResources<P> =>
  providers.reduce((acc, { type }) => {
    acc[type.id] = mapObjects(pluginConstructors[type.id], (constructor, key) => constructor({ pluginId, type, key }))
    return acc
  }, {} as any)

export const createHelper = <X extends Array<AnyResourceProvider>>(providers: X) =>
  providers.reduce((acc, { factories }) => ({ ...acc, ...factories }), {})
