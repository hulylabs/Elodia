/*!
 *   Huly® Platform™ — Core Packages (Elodia) — @huly/crdt-loro-wasm
 *   Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
 *
 * © 2024 Hardcore Engineering Inc. All Rights Reserved.
 */

import type { ContainerId, Crdt, DocId } from '@huly/crdt'
import { listen } from '@huly/crdt'
import { Loro, type LoroEventBatch } from 'loro-crdt'

export function createCRDT(peerId: bigint): Crdt {
  const docs = new Map<string, Loro>()
  const after = { expand: 'after' as 'after' }

  function getOrCreateDoc(docId: DocId): Loro {
    let doc = docs.get(docId)
    if (!doc) {
      doc = new Loro()
      doc.setPeerId(peerId)
      doc.configTextStyle({ bold: after, italic: after, list: after, indent: after, link: after })
      docs.set(docId, doc)
      doc.subscribe((batch: LoroEventBatch) => {
        batch.events.forEach((event) => {
          const containerId = event.path[0] as ContainerId
          const diff = event.diff
          if (diff.type === 'text') listen(docId, containerId, diff.diff, batch.origin)
        })
      })
    }
    return doc
  }

  return {
    open: (docId: DocId, containerId: ContainerId) =>
      Promise.resolve(getOrCreateDoc(docId).getText(containerId).toDelta()),
    apply: (docId, containerId, ops, origin) => {
      const doc = getOrCreateDoc(docId)
      const text = doc.getText(containerId)
      const current = doc.version()
      text.applyDelta(ops as any)
      doc.commit(origin)
      return Promise.resolve(doc.exportFrom(current))
    },
    close: (docId: DocId) => Promise.resolve(void docs.delete(docId)),
  }
}
