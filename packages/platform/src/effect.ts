//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import type { Resource, Status } from './types'

export enum Result {
  OK,
  ERROR,
}

interface Value<V, S extends Status> {
  then(ok: (value: V) => void, error: (status: S) => void): void
}

class Success<V, S extends Status> implements Value<V, S> {
  private value: V

  constructor(value: V) {
    this.value = value
  }

  public then(success: (value: V) => void, _: (status: S) => void): void {
    success(this.value)
  }
}

class Failure<V, S extends Status> implements Value<V, S> {
  private status: S

  constructor(status: S) {
    this.status = status
  }

  public then(_: (value: V) => void, failure: (status: S) => void): void {
    failure(this.status)
  }
}

export class Context {
  getService<T>(resource: Resource<T>): T {}

  success<V, S extends Status>(value: V): Value<V, S> {
    return new Success(value)
  }

  failure<V, S extends Status>(status: S): Value<V, S> {
    return new Failure(status)
  }
}

export type Effect<V, S extends Status> = (ctx: Context) => Value<V, S>
