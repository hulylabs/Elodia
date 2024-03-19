// E X A M P L E

type IntlResourceTypeId = 'i18n'

type Primitive = string | number | boolean
type Params = Record<string, Primitive>

type IntlString<P extends Params> = ResourceId<IntlResourceTypeId, P>

const translate = <P extends Params>(i18n: IntlString<P>, params: P): string => i18n.key + JSON.stringify(params)

const IntlStringResourceProvider = {
  type: createResourceType<Params, 'i18n'>('i18n'),
  factory:
    <P extends Params>() =>
    (i18n: IntlString<P>) =>
    (params: P) =>
      translate(i18n, params),
}

const platform = createPlatform([IntlStringResourceProvider])

const plugin = platform.plugin('my-plugin', (_) => ({
  i18n: {
    X: _.i18n(),
  },
}))

console.log(plugin.i18n.X({ a: 1 }))
