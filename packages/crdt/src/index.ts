/*!
 *   Huly® Platform™ — Core Packages (Elodia) — @huly/crdt
 *   Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
 *
 * © 2024 Hardcore Engineering Inc. All Rights Reserved.
 */

// enum ContainerType {
//   Text = 'text',
// }

type Attributes = Record<string, unknown>
type OpInsert = { insert: string; attributes?: Attributes }
type OpDelete = { delete: number }
type OpRetain = { retain: number }
type Op = OpInsert | OpDelete | OpRetain

type OpListener = (ops: Op[], origin?: string) => void

export type DocId = string
export type ContainerId = string

export interface Crdt {
  open(docId: DocId, containerId: ContainerId): Promise<Op[]>
  apply: (docId: DocId, containerId: ContainerId, ops: Op[], origin?: string) => Promise<Uint8Array>
  close(docId: DocId): Promise<void>
}

export interface Doc {
  readonly uuid: string
  container(containerId: string, listener: OpListener): Container
}
export interface Container {
  open(): Promise<Op[]>
  apply(ops: Op[], origin: string): Promise<Uint8Array>
  close(): void
}

type CompList<T> = T | T[] | undefined
function* iterateCompList<T>(list: CompList<T>): Generator<T> {
  if (list) {
    if (Array.isArray(list)) for (const sink of list) yield sink
    else yield list
  }
}
function addCompList<T>(list: CompList<T>, item: T): CompList<T> {
  if (list)
    if (Array.isArray(list)) list.push(item)
    else list = [list, item]
  else list = item
  return list
}
function removeCompList<T>(list: CompList<T>, item: T): CompList<T> {
  if (list)
    if (Array.isArray(list)) {
      const index = list.indexOf(item)
      if (index >= 0) {
        list.splice(index, 1)
        if (list.length === 1) list = list[0]
      }
    } else if (list === item) list = undefined
  return list
}

const docs = new Map<string, Map<string, CompList<OpListener>>>()

function subscribe(uuid: string, containerId: ContainerId, listener: OpListener) {
  const containerListeners = docs.get(uuid) ?? new Map<string, CompList<OpListener>>()
  const listeners = addCompList(containerListeners.get(containerId), listener)
  containerListeners.set(containerId, listeners)
  docs.set(uuid, containerListeners)
}

function unsubscribe(crdt: Crdt, docId: DocId, containerId: ContainerId, listener: OpListener) {
  const containerListeners = docs.get(docId)
  if (containerListeners) {
    const listeners = removeCompList(containerListeners.get(containerId), listener)
    if (listeners) containerListeners.set(containerId, listeners)
    else containerListeners.delete(containerId)
    if (containerListeners.size > 0) docs.set(docId, containerListeners)
    else {
      docs.delete(docId)
      crdt.close(docId)
    }
  }
}

export type DocFactory = (uuid: DocId) => Doc

export const createDocFactory =
  (crdt: Crdt): DocFactory =>
  (uuid: DocId): Doc => ({
    uuid,
    container: (containerId: string, listener: OpListener): Container => {
      subscribe(uuid, containerId, listener)
      return {
        open: () => crdt.open(uuid, containerId),
        apply: (ops: Op[], origin: string) => crdt.apply(uuid, containerId, ops, origin),
        close: () => unsubscribe(crdt, uuid, containerId, listener)
      }
    }
  })

export function listen(docId: DocId, containerId: ContainerId, ops: Op[], origin?: string) {
  for (const listener of iterateCompList(docs.get(docId)?.get(containerId))) listener(ops, origin)
}
