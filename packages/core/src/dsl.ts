//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import type { IntlString, Params, ResourceId } from '@huly/platform'
import type { Class, DataType, Doc, Obj, Ref } from './model'

export abstract class DataTypeDeclaration {}

export class RefDataType<T extends Doc> extends DataTypeDeclaration {
  readonly class: ResourceId<Ref<Class<T>>>

  constructor(klass: ResourceId<Ref<Class<T>>>) {
    super()
    this.class = klass
  }
}

export class TimestampDataType extends DataTypeDeclaration {}
export class AccountDataType extends DataTypeDeclaration {}

type StructuralElements = Record<string, StructuralElement>
type ModelElements = Record<string, Classifier>

export abstract class StructuralElement {
  datatype?: DataTypeDeclaration

  ref(klass: ResourceId<Ref<Class<Doc>>>) {
    this.datatype = new RefDataType(klass)
    return this
  }

  timestamp() {
    this.datatype = new TimestampDataType()
    return this
  }

  account() {
    this.datatype = new AccountDataType()
    return this
  }
}

export class AttributeDeclaration extends StructuralElement {
  constructor() {
    super()
  }
}

export abstract class Classifier {}

export class ClassDeclaration {
  readonly id: ResourceId<Ref<Class<Obj>>>
  readonly extends: ResourceId<Ref<Class<Obj>>>
  readonly decl: StructuralElements

  constructor(id: ResourceId<Ref<Class<Obj>>>, ext: ResourceId<Ref<Class<Obj>>>, decl: StructuralElements) {
    this.id = id
    this.extends = ext
    this.decl = decl
  }
}

export class ModelDeclaration {
  readonly name: string
  readonly elements: ModelElements

  constructor(name: string, elements: ModelElements) {
    this.name = name
    this.elements = elements
  }
}

export const dsl = {
  model(name: string, classifiers: ModelElements) {
    return new ModelDeclaration(name, classifiers)
  },
  class(id: ResourceId<Ref<Class<Obj>>>, ext: ResourceId<Ref<Class<Obj>>>, decl: StructuralElements): ClassDeclaration {
    return new ClassDeclaration(id, ext, decl)
  },
  attr() {
    return new AttributeDeclaration()
  },
  // ref(class: ResourceId<Ref<Class<Obj>>>)
}

// interface UXDefinition {
//   label<M extends Params>(label: IntlString<M>): this
// }

// interface DataTypeDefinition {}

// interface ClassDefinition {}

// const model = {
//   // x: IntlString,
//   // ref(): DataTypeDefinition {},
// }

// const Obj = {
//   class: 'Ref<Class<this>>',
// }
