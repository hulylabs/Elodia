//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/resources/status.ts
//

import { createResourceType, type ResourceId } from '../modules/resource'
import { type IntlString } from './i18n'

type StatusTypeId = 'status'
export type Params = Record<string, string | number | boolean>
export type StatusId<P extends Params> = ResourceId<StatusTypeId, P>

export enum Result {
  OK,
  ERROR,
}

export interface Status<M extends Params = any, P extends M = M> {
  readonly id: StatusId<P>
  readonly result: Result
  readonly params: P
  readonly message?: IntlString<M>
}

export const statusProvider = {
  type: createResourceType<Params, StatusTypeId>('status'),
  factory:
    <M extends Params, P extends M = M>(result: Result) =>
    (id: StatusId<P>) =>
    (params: P, message?: IntlString<M>): Status<M, P> => ({
      id,
      result,
      params,
      message,
    }),
}
