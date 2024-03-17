//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { IO, type Out } from './io'
import { Resources, type PluginId } from './resource'
import type { IntlString, Params, ResourceId, Status, StatusFactory } from './types'
import { Result } from './types'

import IntlMessageFormat from 'intl-messageformat'

import en from '../lang/en.json'

export type IntlStringFactory<M extends Params> = {
  id: ResourceId<IntlStringFactory<M>>
  translate: (params: M) => IO<M, string>
}

export const $status =
  <M extends Params = void, P extends M = M>(result: Result, message?: IntlString<M>) =>
  (id: ResourceId<StatusFactory<M, P>>) => ({
    id,
    create: (params: P) => ({ id, params, result, message }),
    cast: (status: Status<any, any>): Status<M, P> => {
      const statusId = status.id as string
      if (statusId !== id) {
        const errorStatus = platform.status.CastException.create({ id: statusId })
        throw new PlatformError(errorStatus)
      }
      return status
    },
  })

const strings: any = { en }

export const platform = Resources.plugin('platform', (_) => ({
  status: {
    UnknownError: _($status<{ message: string }>(Result.ERROR)),
    CastException: _($status<{ id: string }>(Result.ERROR)),
  },
}))

platform.$.setLocalizedStringLoader(
  (locale: string): Out<Record<string, string>> =>
    IO.syncIO(() => {
      const localized = strings[locale] as Record<string, string>
      if (!localized) {
        throw new Error(`Unsupported locale: ${locale}`) // TODO: Need to work on IO failures
      }
      return localized
    }),
)

const getCurrentLocale = (): string => 'en'

const cachedLocales: Map<string, Record<string, string>> = new Map()

const getCachedLocale = (pluginId: PluginId, locale: string): Record<string, string> | undefined =>
  cachedLocales.get(pluginId + '-' + locale)

const setCachedLocale = (pluginId: PluginId, locale: string, strings: Record<string, string>) => {
  cachedLocales.set(pluginId + '-' + locale, strings)
}

const getLocale = (pluginId: PluginId, locale: string): Out<Record<string, string>> => {
  const cachedLocale = getCachedLocale(pluginId, locale)
  if (cachedLocale) {
    IO.syncIO(() => cachedLocale) // TODO: success
  }
  const plugin = Resources.getPlugin(pluginId)
  const localizedStrings = plugin.$.getLocalizedStrings(locale)
  return IO.chain(localizedStrings, (strings) => {
    setCachedLocale(pluginId, locale, strings)
    return strings
  })
}

const messageFormat = <P extends Params>(
  locale: string,
  messageId: IntlString,
  params: P,
): IO<Record<string, string>, string> =>
  IO.syncIO((locales: Record<string, string>) => {
    const key = Resources.destructureId(messageId).key
    const message = locales[key]
    const messageFormatter = new IntlMessageFormat(message, locale)
    return messageFormatter.format(params as any)
  })

const translate = <P extends Params>(messageId: IntlString, params: P): Out<string> => {
  const locale = getCurrentLocale()
  const format = messageFormat(locale, messageId, params)
  const cachedLocale = cachedLocales.get(locale)
  return cachedLocale ? format : getLocale(Resources.destructureId(messageId).pluginId, locale).to(format)
}

export function getStatus<M extends Params, P extends M>(error: Error) {
  if (error instanceof PlatformError) {
    return error.status as Status<M, P>
  }
  return platform.status.UnknownError.create({ message: error.message })
}

export class PlatformError<M extends Params, P extends M> extends Error {
  readonly status: Status<M, P>

  constructor(status: Status<M, P>) {
    super()
    this.status = status
  }
}

export const Platform = {
  translate,
}
