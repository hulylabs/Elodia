const helpers = [
  { hnum: (() => 5) as <T>() => number & { x: T } },
  { hstr: (() => 'xyz') as <T>() => string & { y: T } },
]

type HelperObjects = (typeof helpers)[number] // Union of all types in the helpers array
type HelperKeys = keyof HelperObjects // Union of keys of all helper objects

// We ensure that the function type is always a function and never `undefined`
// by excluding `undefined` from the type if the property is optional.
type HelperType = {
  [K in HelperKeys]: Exclude<HelperObjects[K], undefined>
}

// Now, we create the helper object with the defined HelperType
const helper: HelperType = Object.assign({}, ...helpers)

// Let's check the properties
const hnumResult = helper.hnum<boolean>() // It should be 'number'
const hstrResult = helper.hstr() // It should be 'string'

// Test the type correctness; these should not have '?' anymore
declare const h: HelperType
const m = h.hnum() //
