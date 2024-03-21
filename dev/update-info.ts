//
// © 2024 Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: EPL-2.0).
//
// · dev/update-info.ts
//

import { Glob } from 'bun'

function getDirName(filePath: string): string {
  // Split the filePath by / and return the path without the last segment (the file itself)
  const parts = filePath.split('/')
  parts.pop() // Remove the last segment (file name)
  return parts.join('/') // Rejoin the remaining segments into a directory path
}

function joinPath(...segments: string[]): string {
  // Join path segments using / and remove any accidental double slashes
  return segments.join('/').replace(/\/{2,}/g, '/')
}

async function updateTsFile(file: string, header: string) {
  const bunFile = Bun.file(file)
  const currentContent = await bunFile.text()

  if (!currentContent.startsWith(header)) {
    const updatedContent = `${header}${currentContent}`
    await Bun.write(bunFile, updatedContent)
    console.log(`Updated header for: ${file}`)
  }
}

async function generateTsHeader(fileName: string, packageName: string, projectInfo: any): Promise<string> {
  return fileName === 'index.ts'
    ? `/**
 * © ${projectInfo.year} Hardcore Engineering, Inc. All Rights Reserved.
 * Licensed under the Eclipse Public License v2.0 (SPDX: ${projectInfo.license}).
 *
 * · ${projectInfo.description} · ${projectInfo.homepage} · @huly/${packageName}
 */
`
    : `//
// © ${projectInfo.year} Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: ${projectInfo.license}).
//
// · ${packageName}/${fileName}
//
`
}

async function updatePackages() {
  const projectInfoBunFile = Bun.file('project-info.json')
  const projectInfoText = await projectInfoBunFile.text()
  const projectInfo = JSON.parse(projectInfoText)

  const rootPackageBunFile = Bun.file('package.json')
  const rootPackageText = await rootPackageBunFile.text()
  const rootPackage = JSON.parse(rootPackageText)

  for (const pattern of rootPackage.workspaces) {
    const glob = new Glob(pattern)
    for await (const file of glob.scan('.')) {
      if (file.endsWith('package.json')) {
        const packageJsonBunFile = Bun.file(file)
        const packageJsonText = await packageJsonBunFile.text()
        const packageJson = JSON.parse(packageJsonText)

        // Merge projectInfo into packageJson
        Object.assign(packageJson, projectInfo)

        // Write the updated package.json back to disk
        await Bun.write(file, JSON.stringify(packageJson, null, 2))
        console.log(`Updated: ${file}`)
      }

      if (file.endsWith('.ts')) {
        const dirName = getDirName(file)
        const packageJsonPath = joinPath(dirName, 'package.json')
        const packageJsonFileSize = Bun.file(packageJsonPath).size
        if (packageJsonFileSize > 0) {
          const packageJsonText = await Bun.file(packageJsonPath).text()
          const packageJson = JSON.parse(packageJsonText)
          const packageName = packageJson.name.replace(/^@huly\//, '')
          const header = await generateTsHeader(file.slice(file.lastIndexOf('/') + 1), packageName, projectInfo)
          await updateTsFile(file, header)
        }
      }
    }
  }
}

updatePackages().catch((error) => {
  console.error('Failed to update package.json files and .ts headers:', error)
})
