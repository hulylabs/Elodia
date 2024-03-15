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

// export enum Severity {
//   OK,
//   INFO,
//   WARN,
//   ERROR,
// }

// export interface Status<P extends Params = void> {
//   readonly severity: Severity
//   readonly code: ResourceId
//   readonly params: P
//   readonly i18n: IntlString<P>
// }

// export type StatusFactory<P extends Params = void> = (params: P) => Status<P>
