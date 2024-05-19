//

import { listen, type Crdt } from '@huly/crdt'

export function dummyCrdt(): Crdt {
  return {
    open: () => Promise.resolve([]),
    apply: (docId, containerId, ops, origin) => {
      listen(docId, containerId, ops, origin)
      return Promise.resolve(new Uint8Array())
    },
    close: () => Promise.resolve()
  }
}
