import packageJson from '../package.json'
import projectInfo from '../project-info.json'

const copyrightTs = `
//
// © {{year}} {{company}}. All Rights Reserved.
// Licensed under the {{full_license}} (SPDX: {{license}}).
//
// · {{filename}}
//


`

import { Glob, spawnSync } from 'bun'
import path from 'node:path'

function constructVersion(): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '')

  const result = spawnSync(['git', 'rev-parse', '--short', 'HEAD'])
  const sha = result.stdout.toString().trim()

  const newVersion = `${version}+${date}-sha.${sha}`
  return newVersion
}

const newVersion = constructVersion()
const { description, version } = projectInfo['package.json']

function replacePlaceholders(template: string, placeholderValues: Record<string, string>): string {
  return template.replace(/{{\s*([\w_]+)\s*}}/g, (match, name) => {
    // If the placeholder key exists in the provided values, replace it; otherwise, do not replace it.
    return placeholderValues.hasOwnProperty(name) ? placeholderValues[name] : match
  })
}

function removeCommentLines(content: string): string {
  const lines = content.split('\n')

  let i = 0
  for (; i < lines.length; i++) {
    const trimmedLine = lines[i].trim()
    if (!trimmedLine.startsWith('//') && !trimmedLine.startsWith('/*') && !trimmedLine.startsWith(' *')) {
      break
    }
  }
  return lines.slice(i).join('\n')
}

async function processSource(filePath: string): Promise<void> {
  console.log(`processing source file at '${filePath}'...`)

  const fileContent = await Bun.file(filePath).text()
  const noCommentContent = removeCommentLines(fileContent)

  const filename = path.basename(filePath)
  const placeholderValues = {
    ...projectInfo['package.json'],
    ...projectInfo.other,
    version: newVersion,
    filename,
  }
  const newComment = replacePlaceholders(copyrightTs, placeholderValues as any)
  const newContent = newComment + '\n' + noCommentContent

  await Bun.write(filePath, newContent)
}

async function processPackage(filePath: string): Promise<void> {
  const packageDir = path.dirname(filePath)
  try {
    const fileContent = await Bun.file(filePath).text()
    const packageData = JSON.parse(fileContent)
    const name = packageData.name

    console.log(`\nprocessing '${name}'...`)

    const newPackageData = {
      ...packageData,
      ...projectInfo['package.json'],
      version: newVersion,
    }
    const updatedPackageJson = JSON.stringify(newPackageData, null, 2)

    await Bun.write(filePath, updatedPackageJson)

    console.log(`updating copyrights in source files for '${name}'...`)
    const glob = new Glob(`**/*.ts`)
    for await (const file of glob.scan(packageDir)) {
      await processSource(file)
    }
  } catch (error) {
    console.error(`error processing package at ${packageDir}`, error)
  }
}

async function main() {
  console.log(`updating '${description}' project info for version '${newVersion}'...`)

  const locations: string[] = packageJson.workspaces
  for (const location of locations) {
    console.log(`scanning '${location}'...`)
    const glob = new Glob(`${location}/package.json`)
    for await (const file of glob.scan('.')) {
      await processPackage(file)
    }
  }
}

main()
