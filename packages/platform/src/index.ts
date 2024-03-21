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

export const createResourceType = <I extends string, T>(id: I): ResourceType<I, T> => ({ id }) as ResourceType<I, T>

// P R O V I D E R

type ResourceConstructor<I extends string, T> = (resource: ResourceId<I, T>) => any
export interface ResourceProvider<I extends string, T, F extends (...args: any[]) => ResourceConstructor<I, T>> {
  type: ResourceType<I, T>
  factory: F
}
type AnyResourceProvider = ResourceProvider<string, any, (...args: any[]) => any>

// P L A T F O R M

interface ResourceConstructors {
  [type: string]: { [key: string]: ResourceConstructor<any, any> }
}

type InferredResources<T extends ResourceConstructors> = {
  [Type in keyof T]: {
    [Key in keyof T[Type]]: ReturnType<T[Type][Key]> // extends ResourceConstructor<string, any, infer R> ? R : never
  }
}

type Factories<P> = {
  [K in keyof P]: P[K] extends ResourceProvider<any, any, infer F> ? F : never
}
type ResourceProviders = Record<string, AnyResourceProvider>

export interface Module<A extends object, MP extends ResourceProviders> {
  api: A
  resources: MP
}

interface Platform<A extends object, P extends ResourceProviders> {
  loadModule: <MA extends object, MP extends ResourceProviders>(module: Module<MA, MP>) => Platform<A & MA, P & MP>

  plugin: <T extends ResourceConstructors, F extends Factories<P>>(
    name: string,
    resources: (factories: F) => T,
  ) => InferredResources<T> & { id: PluginId }
}

export const createPlatform = <A extends object, P extends Record<string, AnyResourceProvider> = {}>(): Platform<
  A,
  P
> => {
  let apis = {} as A
  let providers = {} as P

  const platform = {
    loadModule: <MA extends object, MP extends ResourceProviders>(module: Module<MA, MP>): Platform<A & MA, P & MP> => {
      apis = { ...apis, ...module.api }
      providers = { ...providers, ...module.resources }
      return platform as Platform<A & MA, P & MP>
    },

    plugin: <T extends ResourceConstructors>(
      name: string,
      resources: (factories: Factories<P>) => T,
    ): InferredResources<T> & { id: PluginId } => {
      const pluginId = name as PluginId
      const constructors = resources(mapObjects(providers, ({ factory }) => factory) as Factories<P>)
      return {
        ...mapObjects(providers, ({ type }) =>
          mapObjects(constructors[type.id], (constructor, key) => constructor({ pluginId, type, key })),
        ),
        id: pluginId,
      } as any
    },
  }

  return platform as Platform<A, P>
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
  type: createResourceType<StatusTypeId, Params>('status'),
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

// E X A M P L E

type XResourceTypeId = 'xtest'
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
    Key1: factories.xtest<{ y: number }>(),
  },
}))

console.log(plugin.xtest.Key1)
