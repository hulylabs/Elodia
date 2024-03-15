//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//

import { expect, test } from 'bun:test'
import { Log } from '../src/log'
import { $res, makeResourceId, parseResourceId, plugin } from '../src/resource'

test('ResourceId', () => {
  const [plugin, category, name] = parseResourceId(
    makeResourceId('testPlugin', 'testCategory', 'testName'),
  )
  expect(plugin).toBe('testPlugin')
  expect(category).toBe('testCategory')
  expect(name).toBe('testName')
})

interface Database {
  connect(): void
}

test('plugin structure with descriptors', () => {
  const testPlugin = plugin('testPlugin', {
    logger: {
      Log: $res<Log>({
        level: 'info',
      }),
    },
    db: {
      Huly: $res<Database>({
        host: 'localhost',
        port: 5432,
      }),
    },
  })

  // Check if it has the categories
  expect(testPlugin).toHaveProperty('logger')
  expect(testPlugin).toHaveProperty('db')

  // Check if each category has its corresponding resources
  expect(testPlugin.logger).toHaveProperty('Log')
  expect(testPlugin.db).toHaveProperty('Huly')

  // Check if each ResourceDescriptor is correct
  expect(testPlugin.logger.Log.id as string).toBe('testPlugin:logger:Log')
  expect(testPlugin.db.Huly.id as string).toBe('testPlugin:db:Huly')
  expect(testPlugin.db.Huly.options.metadata?.host).toBe('localhost')
  expect(testPlugin.db.Huly.options.metadata?.port).toBe(5432)
})
