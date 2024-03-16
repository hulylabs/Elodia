//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

export type Primitive = string | number | boolean
export type Params = Record<string, Primitive>

// S T R I N G

export type IntlString<P extends Params = {}> = (params: P) => string

// S T A T U S

export enum Result {
  OK,
  ERROR,
}

export interface Status<P extends Params = {}> {
  readonly result: Result
  readonly message?: {
    readonly i18n: IntlString<P>
    readonly params: P
  }
}

// R E S O U R C E  A N D  P L U G I N

export type ResourceId = string & { __tag: 'resource' }

// E F F E C T

// export interface Context {}

export interface Effect<V = any, S extends Status = Status> {
  then(success: (value: V) => void, failure?: (status: S) => void): void
}

// export type Effect<V = any, S extends Status = Status> = (
//   ctx: Context,
// ) => Value<V, S>

// P L A T F O R M

// export interface Platform {
//   success<T>(x: T): Value<T>
//   failure<S extends Status>(x: S): Value<never, S>
//   run<T, S extends Status>(effect: Effect<T, S>): Value<T, S>
// }
