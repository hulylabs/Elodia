import packageJson from '../package.json'
import projectInfo from '../project-info.json'

import { Glob, spawnSync } from 'bun'

const { description, version } = projectInfo['package.json']

function constructVersion(): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '')

  const result = spawnSync(['git', 'rev-parse', '--short', 'HEAD'])
  const sha = result.stdout.toString().trim()

  const newVersion = `${version}+${date}-sha.${sha}`
  return newVersion
}

const newVersion = constructVersion()

async function processPackage(filePath: string): Promise<void> {
  try {
    const fileContent = await Bun.file(filePath).text()
    const packageData = JSON.parse(fileContent)

    console.log(`processing '${packageData.name}' version '${packageData.version}'...`)

    const newPackageData = {
      ...packageData,
      ...projectInfo['package.json'],
      ...projectInfo.other,
      version: newVersion,
    }
    const updatedPackageJson = JSON.stringify(newPackageData, null, 2)

    await Bun.write(filePath, updatedPackageJson)
  } catch (error) {
    console.error(`error processing package at ${filePath}`, error)
  }
}

async function main() {
  console.log(`updating '${description}' project info for version '${newVersion}'...`)

  const locations: string[] = packageJson.workspaces
  for (const location of locations) {
    console.log(`scanning ${location}...`)
    const glob = new Glob(`${location}/package.json`)
    for await (const file of glob.scan('.')) {
      await processPackage(file)
    }
  }
}

main()
