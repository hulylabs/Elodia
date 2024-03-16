//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { Resources } from '@huly/platform'
import type { Class, DataType, Doc, Obj, Ref } from '../src/model'

export const core = Resources.plugin('plugin', (_) => ({
  class: {
    Obj: _<Ref<Class<Obj>>>(),
    Doc: _<Ref<Class<Doc>>>(),
    Class: _<Ref<Class<Class<Obj>>>>(),
  },
  datatype: {
    String: _<Ref<DataType>>(),
  },
}))
