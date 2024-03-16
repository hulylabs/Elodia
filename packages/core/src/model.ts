//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

export type Account = string & { __tag: 'account' }
export type Timestamp = number & { __tag: 'timestamp' }
export type Domain = string & { __tag: 'domain' }

export type Primitive = boolean | number | string | Account | Timestamp | Domain | Ref<Doc>
export type PrimitiveArray<T extends Primitive> = T[]

export const Model = 'model' as Domain

export interface Obj {
  class: Ref<Class<this>>
}
export type Ref<T extends Doc> = string & { __ref: T }

// D O C U M E N T S

export interface Doc extends Obj {
  id: Ref<this>
  space: Ref<Space>

  createdOn: Timestamp
  createdBy: Account

  modifiedOn: Timestamp
  modifiedBy: Account
}

export interface Space extends Doc {
  private: boolean
  members: PrimitiveArray<Account>
}

export interface Companion extends Doc {
  companion: Ref<Space>
}

// C L A S S I F I E R S

export enum ClassifierKind {
  Class,
  Interface,
  Mixin,
}

export interface Classifier extends Doc {
  kind: ClassifierKind
}

export interface Interface<E extends Obj = Obj> extends Classifier {
  extends: PrimitiveArray<Ref<Interface<E>>>
}

export interface Class<T extends Obj> extends Classifier {
  __class: T
  extends: Ref<Class<Obj>>
  implements: PrimitiveArray<Ref<Interface>>
}

// D A T A T Y P E S

export type DataTypeConstraint = Primitive | PrimitiveArray<Primitive>

export interface DataType<T extends DataTypeConstraint = DataTypeConstraint> extends Doc {
  __type: T
}

export interface StringDataType extends DataType<string> {}

export interface RefToDataType<T extends Doc> extends DataType<Ref<T>> {
  refTo: Ref<Class<T>>
}

// A T T R I B U T E S

export interface Attribute<T extends DataTypeConstraint> extends Doc {
  classifier: Ref<Class<Obj>>
  name: string
  type: DataType<T>
  default?: T
}
