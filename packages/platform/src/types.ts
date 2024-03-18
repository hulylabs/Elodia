//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · types.ts
//

export type Primitive = string | number | boolean
export type Params = Record<string, Primitive> | undefined

/**
 * In the Huly Platform, a "ResourceId" is a unique identifier that represents a reference
 * to an entity such as an object, function, asset, or UI component, all of which are
 * contributed by plugins. A ResourceId is essentially a string like 'core:function:Optimize',
 * which can be utilized at runtime to retrieve its linked resource. This ID-centric approach
 * is foundational to the platform's modular and scalable architecture.
 *
 * The ResourceId<T> type provides strong typing for identifiers to ensure proper usage
 * within the system, enforcing type safety and preventing misuse.
 *
 * Example:
 *
 * // Logging a ResourceId will output the string ID
 * console.log(core.function.Optimize);  // Output: 'core:function:Optimize'
 */

export type ResourceId<T = any> = string & { __resource: T }
export type IntlString<P extends Params = undefined> = ResourceId<P>

// S T A T U S

export enum Result {
  OK,
  ERROR,
}

export interface Status<M extends Params = undefined, P extends M = M> {
  readonly id: ResourceId<Status<M, P>>
  readonly result: Result
  readonly params: P
  readonly message?: IntlString<M>
}
