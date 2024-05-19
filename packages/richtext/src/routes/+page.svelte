<script lang="ts">
  import { setContext } from 'svelte'

  import { Editor } from '../lib'
  import { dummyCrdt } from '../crdt'
  import { createDocFactory } from '@huly/crdt'

  const docFactory = createDocFactory(dummyCrdt())
  setContext('crdt-doc-factory', docFactory)
</script>

<Editor docId="doc1" path="description" origin="editor1" />
<Editor docId="doc1" path="description" origin="editor2" />
