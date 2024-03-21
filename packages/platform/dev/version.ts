//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · platform/dev/version.ts
//

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}${month}${day}`
}
const currentDate = formatDate(new Date())

const packageJsonPath = join(__dirname, '..', 'package.json')
const packageJsonContent = readFileSync(packageJsonPath, 'utf8')
const packageJson = JSON.parse(packageJsonContent)

const gitCommitSha = execSync('git rev-parse --short HEAD').toString().trim()
const [baseVersion] = packageJson.version.split('+')
const newVersion = `${baseVersion}+${currentDate}-sha.${gitCommitSha}`

packageJson.version = newVersion

writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
console.log(`Updated version in package.json to: ${newVersion}`)
