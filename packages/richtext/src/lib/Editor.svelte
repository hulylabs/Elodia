<script lang="ts">
  import { onMount, getContext, onDestroy } from 'svelte'

  import type { DocFactory, DocId, Container } from '@huly/crdt'
  import Quill, { type EmitterSource } from 'quill'
  import { Op } from 'quill-delta'
  import 'quill/dist/quill.core.css'

  export let docId: DocId
  export let path: string
  export let origin: string

  const doc = getContext<DocFactory>('crdt-doc-factory')(docId)

  let container: Container
  let editor: HTMLElement

  onMount(async () => {
    const quill = new Quill(editor)
    quill.disable()
    container = doc.container(path, (ops: Op[], orgn?: string) => {
      if (orgn !== origin) quill.updateContents(ops, Quill.sources.API)
    })
    quill.setContents(await container.open()) // TODO: show loader, handle errors
    quill.on('text-change', (delta: any, _, source: EmitterSource) => {
      if (source !== Quill.sources.API) container.apply(delta.ops, origin) // TODO: handle errors
    })
    quill.enable()
  })

  onDestroy(() => {
    container.close() // TODO: handle errors
  })
</script>

<div style="height: 240px; width: 100%; border: #fff solid 1px">
  <div bind:this={editor} />
</div>
