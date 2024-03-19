//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/types.ts
//

export type Primitive = string | number | boolean
export type Params = Record<string, Primitive> | undefined

/**
 * In the Huly Platform, a `ResourceId` is a unique identifier that represents a reference
 * to an entity such as an object, function, asset, or UI component, all of which are
 * contributed by plugins. A ResourceId is essentially a string like 'core:function:Optimize',
 * which can be utilized at runtime to retrieve its linked resource. This ID-centric approach
 * is foundational to the platform's modular and scalable architecture.
 *
 * The `ResourceId<T>` type provides strong typing for identifiers to ensure proper usage
 * within the system, enforcing type safety and preventing misuse.
 *
 */
export type ResourceId<T = any> = string & { __resource: T }

// M A N D A T O R Y  R E S O U R C E  T Y P E S

export type IntlString<P extends Params = undefined> = string & { __params: P }

export enum Result {
  OK,
  ERROR,
}

export interface Status<M extends Params = undefined, P extends M = M> {
  readonly code: string // e.g. 'core:status:NotFound' -- this is a ResourceId
  readonly result: Result
  readonly params: P
  readonly message?: IntlString<M>
}
