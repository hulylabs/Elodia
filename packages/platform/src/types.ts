//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

export type Primitive = string | number | boolean
export type Params = Record<string, Primitive>
export type OptParams = Params | undefined

// S T R I N G

export type IntlString<P extends OptParams = undefined> = (params: P) => string

// S T A T U S

export interface Status<P extends OptParams = undefined> {
  readonly code: ResourceDescriptor<Status<P>>
  readonly message?: {
    readonly i18n: IntlString<P>
    readonly params: P
  }
}

// R E S O U R C E

export type ResourceId = string & { __tag: 'resource' }

export interface ResourceOptions<R = any> {
  __resource: R
  readonly metadata: OptParams
}

export interface ResourceDescriptor<R = any> {
  readonly id: ResourceId
  readonly options: ResourceOptions<R>
}

// E F F E C T

export interface Value<V, S extends Status> {
  then(success: (value: V) => void, failure: (status: S) => void): void
}

export interface Context {
  get<R>(resource: ResourceDescriptor<R>): R
}

export type Effect<V, S extends Status> = (ctx: Context) => Value<V, S>

export interface Platform {
  success<T>(x: T): Value<T, Status>
  failure<S extends Status>(x: S): Value<never, S>
}
