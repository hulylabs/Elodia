//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · dev/update-info.ts
//

import { promises as fsPromises } from 'fs'
import * as path from 'path'

const { readFile, writeFile, readdir } = fsPromises

// Function to read JSON from file
async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf8')
  return JSON.parse(content) as T
}

// Function to write JSON to file
async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const content = JSON.stringify(data, null, 2)
  await writeFile(filePath, content, 'utf8')
}

async function updateTsFiles(dir: string, packageName: string, projectInfo: any, filePath?: string) {
  const fullDirPath = filePath ? path.join(dir, filePath) : dir
  const files = await readdir(fullDirPath, { withFileTypes: true })

  for (const file of files) {
    const filePathName = filePath ? `${filePath}/${file.name}` : file.name

    if (file.isDirectory()) {
      await updateTsFiles(dir, packageName, projectInfo, filePathName)
    } else if (file.isFile() && file.name.endsWith('.ts')) {
      const fullPath = path.join(fullDirPath, file.name)
      const fileContent = await readFile(fullPath, 'utf8')

      const header = fullPath.endsWith('index.ts')
        ? `/**
 * © ${projectInfo.year} ${projectInfo.author}. All Rights Reserved.
 * Licensed under the ${projectInfo.license} (SPDX: ${projectInfo.license}).
 *
 * · ${projectInfo.description} · ${projectInfo.homepage} · ${packageName}
 */
`
        : `//
// © ${projectInfo.year} ${projectInfo.author}. All Rights Reserved.
// Licensed under the ${projectInfo.license} (SPDX: ${projectInfo.license}).
//
// · ${packageName.replace('@huly/', '')}/${filePathName}
//
`

      // Only update the file content if the header is not already present
      if (!fileContent.startsWith(header)) {
        const newContent = `${header}\n${fileContent}`
        await writeFile(fullPath, newContent, 'utf8')
        console.log(`Updated header for: ${fullPath}`)
      }
    }
  }
}

// Main function to update package.json files
async function updatePackages() {
  // Read the project info and root package.json
  const projectInfo = await readJsonFile<any>('project-info.json')
  const rootPackage = await readJsonFile<any>('package.json')

  // Iterate through the workspaces and update package.json files
  for (const workspace of rootPackage.workspaces) {
    const packageDir = path.resolve(__dirname, workspace)
    try {
      const packageFiles = await readdir(packageDir)

      for (const file of packageFiles) {
        // Only continue if the file is a package.json
        if (!file.match(/^package\.json$/)) continue

        const packagePath = path.join(packageDir, file)
        const packageJson = await readJsonFile<any>(packagePath)

        // Update package.json fields with project info
        packageJson.version = projectInfo.version
        packageJson.description = projectInfo.description
        packageJson.homepage = projectInfo.homepage
        packageJson.license = projectInfo.license
        packageJson.repository = projectInfo.repository
        packageJson.author = projectInfo.author
        packageJson.contributors = projectInfo.contributors

        // Write the updated package.json back to disk
        await writeJsonFile(packagePath, packageJson)
        console.log(`Updated: ${packagePath}`)
      }
    } catch (error) {
      console.error(`Error updating package in ${packageDir}:`, error)
    }
  }
}

updatePackages().catch((error) => {
  console.error('Failed to update package.json files and .ts headers:', error)
})
