//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

export type Primitive = string | number | boolean
export type Params = Record<string, Primitive>

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
