/**
 * © 2024 Hardcore Engineering, Inc. All Rights Reserved.
 * Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
 *
 * · Huly Platform
 */

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

export const createResourceType = <T, I extends string>(id: I): ResourceType<I, T> => ({ id }) as ResourceType<I, T>

// P R O V I D E R

type ResourceConstructor<I extends string, T, R> = (resource: ResourceId<I, T>) => R
export interface ResourceProvider<I extends string, T, R, F extends (...args: any[]) => ResourceConstructor<I, T, R>> {
  type: ResourceType<I, T>
  factory: F
}
type AnyResourceProvider = ResourceProvider<string, any, any, any>

// P L A T F O R M

interface ResourceConstructors {
  [resourceTypeId: string]: { [key: string]: ResourceConstructor<string, any, any> }
}

type InferredResources<T extends ResourceConstructors> = {
  [Type in keyof T]: {
    [Key in keyof T[Type]]: T[Type][Key] extends ResourceConstructor<string, any, infer R> ? R : never
  }
}

type Factories<P> = {
  [K in keyof P]: P[K] extends ResourceProvider<string, any, any, infer F> ? F : never
}
type ResourceProviders = Record<string, AnyResourceProvider>

interface API<A extends object> {
  api: () => A
}

interface Platform<A extends object, P extends ResourceProviders> {
  loadModule: <MA extends object>(module: API<MA>) => Platform<A & MA, P>

  addResourceProvider: <MP extends AnyResourceProvider>(
    resourceProvider: MP,
  ) => Platform<A, P & { [K in MP['type']['id']]: MP }>

  createResource: <T extends ResourceConstructors>(
    name: PluginId,
    resources: (_: Factories<P>) => T,
  ) => InferredResources<T> & { id: PluginId }
}

export const createPlatform = <A extends object, P extends Record<string, AnyResourceProvider> = {}>(): Platform<
  A,
  P
> => {
  let apis = {} as A
  let providers = {} as P

  const platform = {
    loadModule: <MA extends object>(module: API<MA>): Platform<A & MA, P> => {
      apis = { ...apis, ...module.api() }
      return platform as Platform<A & MA, P>
    },

    addResourceProvider: <MP extends AnyResourceProvider>(
      resourceProvider: MP,
    ): Platform<A, P & { [K in MP['type']['id']]: MP }> => {
      ;(providers as any)[resourceProvider.type.id] = resourceProvider
      return platform as Platform<A, P & { [K in MP['type']['id']]: MP }>
    },

    createResource: <T extends ResourceConstructors>(
      pluginId: PluginId,
      resources: (_: Factories<P>) => T,
    ): InferredResources<T> & { id: PluginId } => {
      const constructors = resources(mapObjects(providers, ({ factory }) => factory) as Factories<P>)
      return {
        ...mapObjects(providers, ({ type }) =>
          mapObjects(constructors[type.id], (constructor, key) => constructor({ pluginId, type, key })),
        ),
        id: pluginId,
      } as any
    },
  }
  return platform
}

// S T A T U S

type StatusTypeId = 'status'
export type Params = Record<string, string | number | boolean>
export type StatusId<P extends Params> = ResourceId<StatusTypeId, P>

export enum Result {
  OK,
  ERROR,
}

export interface Status<P extends Params = any> {
  readonly id: StatusId<P>
  readonly result: Result
  readonly params: P
}

export const statusProvider = {
  type: createResourceType<Params, StatusTypeId>('status'),
  factory:
    <P extends Params>(result: Result) =>
    (id: StatusId<P>) =>
    (params: P): Status<P> => ({ id, result, params }),
}

export class PlatformError extends Error {
  readonly status: Status<any>

  constructor(status: Status<any>) {
    super()
    this.status = status
  }
}
