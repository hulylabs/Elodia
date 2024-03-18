//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { createIO, pipe, success, type IO, type Out } from './io'
import { Resources, pluginId, type Locale, type LocalizedStrings, type PluginId } from './resource'
import type { IntlString, Params, ResourceId, Status, StatusFactory } from './types'
import { Result } from './types'

import IntlMessageFormat from 'intl-messageformat'

import en from '../lang/en.json'

export type IntlStringFactory<M extends Params> = {
  id: ResourceId<IntlStringFactory<M>>
  translate: (params: M) => IO<M, string>
}

export const $status =
  <M extends Params = undefined, P extends M = M>(result: Result, message?: IntlString<M>) =>
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

type IOResourceFactory<I, O> = (id: ResourceId<any>) => () => IO<I, O>

export const $IO = <I, O>(factory: IOResourceFactory<I, O>) => factory

const platformIO = createIO({
  errorToStatus: (error: unknown): Status => {
    if (error instanceof PlatformError) return error.status
    if (error instanceof Error) return platform.status.UnknownError.create({ message: error.message })
    throw error // not our business
  },

  defaultFailureHandler: (status: Status): void => {
    console.error('unhandled status: ', status)
  },
})

const strings: any = { en }

export const platform = Resources.plugin('platform', (_) => ({
  status: {
    UnknownError: _($status<{ message: string }>(Result.ERROR)),
    CastException: _($status<{ id: string }>(Result.ERROR)),
  },
  string: {
    CopyrightMessage: _<{ year: string }>(),
    License: _(),
    Author_1: _(),
  },
  io: {},
}))

// TODO: $IO

platform.$.setLocalizedStringLoader(
  (): IO<string, Record<string, string>> =>
    platformIO.syncIO((locale: string) => {
      const localized = strings[locale] as Record<string, string>
      if (!localized) {
        throw new Error(`Unsupported locale: ${locale}`) // TODO: Need to work on IO failures
      }
      return localized
    }),
)

const getCurrentLocale = (): Locale => 'en' as Locale

type CacheKey = string & { __cacheKey: true }

const cachedStrings: Map<CacheKey, LocalizedStrings> = new Map()
const cacheKey = (pluginId: PluginId, locale: Locale) => (pluginId + '-' + locale) as CacheKey

const messageFormatIO = <P extends Params>(
  locale: string,
  messageId: IntlString<P>,
  params?: P,
): IO<Record<string, string>, string> =>
  platformIO.syncIO((strings: LocalizedStrings) => {
    console.log('strings: ', strings)
    const key = Resources.destructureId(messageId).key
    console.log('key: ', key)
    const message = strings[key]
    console.log('message: ', message)
    const messageFormatter = new IntlMessageFormat(message, locale)
    const result = messageFormatter.format(params as any) as string
    return result
  })

const translate = <P extends Params>(messageId: IntlString<P>, params: P): Out<string> => {
  const locale = getCurrentLocale()
  const formatIO = messageFormatIO(locale, messageId, params)
  const cached = cachedStrings.get(cacheKey(pluginId(messageId), locale))

  if (cached) {
    console.log('use cached strings: ', cached)
    return success(cached).pipe(formatIO)
  }

  console.log('fetching strings for locale: ', locale)
  const io = pipe(
    Resources.getPlugin(pluginId(messageId)).$.getLocalizedStrings(),
    platformIO.syncIO((strings: LocalizedStrings) => {
      console.log('fetched strings: ', strings)
      cachedStrings.set(cacheKey(pluginId(messageId), locale), strings)
      return strings
    }),
    formatIO,
  )
  io.success(locale)
  return io
}

export class PlatformError<M extends Params, P extends M> extends Error {
  readonly status: Status<M, P>

  constructor(status: Status<M, P>) {
    super()
    this.status = status
  }
}

const log = () =>
  platformIO.syncIO((value: any) => {
    console.log('***** PLATFORM: ', value)
    return value
  })

export const Platform = {
  IO: platformIO,
  translate,
  log,
}

export const TestPackage = {
  messageFormatIO,
}
