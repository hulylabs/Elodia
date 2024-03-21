//
// © 2024 Hardcore Engineering Inc. All Rights Reserved.
//   Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · core/dsl.test.ts
//

// import { expect, test } from 'bun:test'

// import { core } from '../src/core'
// import { dsl } from '../src/dsl'

// const model = dsl.model('core', {
//   Obj: dsl.class(core.class.Obj, core.class.Obj, {
//     class: dsl.attr().ref(core.class.Class),
//   }),
//   Doc: dsl.class(core.class.Doc, core.class.Obj, {
//     id: dsl.attr().ref(core.class.Doc),

//     createdOn: dsl.attr().timestamp(),
//     createdBy: dsl.attr().account(),

//     modifiedOn: dsl.attr().timestamp(),
//     modifiedBy: dsl.attr().account(),
//   }),
//   Class: dsl.class(core.class.Class, core.class.Doc, {
//     extends: dsl.attr().ref(core.class.Class),
//   }),
// })

// // console.dir(core)
// // console.dir(model)

// test('core model', () => {
//   expect(model.name).toBe('core')
// })
