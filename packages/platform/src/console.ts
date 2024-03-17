//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { IO, type Out } from './io'

export const Console = {
  log: <T,>(value: Out<T>) => {
    value.to({
      success: (value) => console.log(value),
      failure: () => {},
    })
  },
}
