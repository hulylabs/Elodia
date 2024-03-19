const helpers = [
  { data: { hnum: (() => 5) as <T>() => number & { x: T } } },
  { data: { hstr: (() => 'xyz') as <T>() => string & { y: T } } },
]

// This maps and combines the nested 'data' structure of each helper into a single type.
type CombineNestedHelpers<T extends Array<{ data: any }>> = {
  [K in keyof T[number]['data']]-?: T[number]['data'][K] extends infer U | undefined ? U : never
}

// Here, the type is a mapped object based on the array structure.
type CombinedHelperType = CombineNestedHelpers<typeof helpers>

// Now we can create an object of type CombinedHelperType from the original helpers.
const combinedHelpers: CombinedHelperType = helpers.reduce(
  (acc, obj) => ({
    ...acc,
    ...obj.data,
  }),
  {} as CombinedHelperType,
)

// Using the `combinedHelpers` type, we should be able to call `hnum` and `hstr` without optional chaining.
// They should also maintain their original parameter types.
declare const h: CombinedHelperType
const m = h.hnum<boolean>() // No '?' and it should now work without TypeScript error.
const n = h.hstr()
