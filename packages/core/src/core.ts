//
//   Huly® Platform™ Core • core/core.ts
//   Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// © 2024 Hardcore Engineering Inc. All Rights Reserved.
//

import type { Class, DataType, Doc, Obj, Ref } from '../src/model'

export const core = Resources.plugin('core', (_) => ({
  class: {
    Obj: _<Ref<Class<Obj>>>(),
    Doc: _<Ref<Class<Doc>>>(),
    Class: _<Ref<Class<Class<Obj>>>>(),
  },
  datatype: {
    String: _<Ref<DataType>>(),
  },
  label: {
    CreatedOn: _<IntlString>(),
  },
}))
