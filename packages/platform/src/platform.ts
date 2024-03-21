//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/platform.ts
//

import { Platform } from './legacy/platform'
import { homepage, mapObjects, version, type StdIO } from './util'

// R E S O U R C E  M A N A G E M E N T

type PluginId = string & { __tag: 'plugin-id' }
type ResourceTypeId<I extends string> = I & { __tag: 'resource-type-id' }
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

type ResourceConstructor<I extends string, T> = (platform: Platform<any, any>, resource: ResourceId<I, T>) => any
interface ResourceProvider<I extends string, T, F extends (...args: any[]) => ResourceConstructor<I, T>> {
  type: ResourceType<I, T>
  factory: F
}
type AnyResourceProvider = ResourceProvider<string, any, (...args: any[]) => any>
export const createResourceProvider = <T, P extends ResourceProvider<any, T, any>>(provider: P): P => provider

// L O C A L E

export type Locale = {
  language: string
  country?: string
}

export const createLocale = (language: string, country?: string): Locale => ({ language, country })

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
interface Module<A extends object, MP extends ResourceProviders> {
  readonly id: string
  api: A
  resources: MP
}

type API = Record<string, Function>

export interface Platform<A extends API, P extends ResourceProviders> {
  locale: Locale
  loadModule: <MA extends object, MP extends ResourceProviders>(module: Module<MA, MP>) => Platform<A & MA, P & MP>
  plugin: <T extends ResourceConstructors, F extends Factories<P>>(
    name: string,
    resources: (factories: F) => T,
  ) => InferredResources<T> & { id: PluginId }
}

export const createPlatform = <A extends API, P extends Record<string, AnyResourceProvider> = {}>(
  locale: Locale,
  std: StdIO,
): Platform<A, P> => {
  std.out(`booting platform version ${version} (${homepage}})`)

  let apis = {} as A
  let providers = {} as P

  const platform: Platform<A, P> = {
    locale,

    loadModule: <MA extends API, MP extends ResourceProviders>(module: Module<MA, MP>): Platform<A & MA, P & MP> => {
      std.out(`loading \`${module.id}\` module...`)
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
          mapObjects(constructors[type.id], (constructor, key) => constructor(platform, { pluginId, type, key })),
        ),
        id: pluginId,
      } as any
    },
  } as Platform<A, P>
  return platform
}
