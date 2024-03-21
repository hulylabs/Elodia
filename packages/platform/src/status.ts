//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/status.ts
//

import { createResourceType, type ResourceId } from './platform'

// S T A T U S

const status = 'status'

type StatusTypeId = typeof status
type Params = Record<string, string | number | boolean>
type StatusId<P extends Params> = ResourceId<StatusTypeId, P>

export enum Result {
  OK,
  ERROR,
}

export interface Status<P extends Params = any> {
  readonly id: StatusId<P>
  readonly result: Result
  readonly params: P
}

const createStatusProvider = () => ({
  type: createResourceType<StatusTypeId, Params>(status),
  factory:
    <P extends Params>(result: Result) =>
    (id: StatusId<P>) =>
    (params: P): Status<P> => ({ id, result, params }),
})

export const createStatusPlugin = () => ({
  api: {},
  resources: { [status]: createStatusProvider() },
})

export class PlatformError extends Error {
  readonly status: Status<any>

  constructor(status: Status<any>) {
    super()
    this.status = status
  }
}
