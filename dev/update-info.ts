import { Glob } from 'bun'

function getDirName(filePath: string): string {
  const parts = filePath.split('/')
  parts.pop()
  return parts.join('/')
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

async function generateTsHeader(fileName: string, projectName: string, projectInfo: any): Promise<string> {
  return fileName === 'index.ts'
    ? `/**
 * © ${projectInfo.year} Hardcore Engineering, Inc. All Rights Reserved.
 * Licensed under the Eclipse Public License v2.0 (SPDX: ${projectInfo.license}).
 *
 * · ${projectInfo.description} · ${projectInfo.homepage} · @huly/${projectName}
 */
`
    : `//
// © ${projectInfo.year} Hardcore Engineering, Inc. All Rights Reserved.
// Licensed under the Eclipse Public License v2.0 (SPDX: ${projectInfo.license}).
//
// · ${projectName}/${fileName}
//
`
}

async function updatePackageJson(file: string, projectInfo: any) {
  const packageJsonText = await Bun.file(file).text()
  const packageJson = JSON.parse(packageJsonText)

  // Merge projectInfo into packageJson
  Object.assign(packageJson, projectInfo)

  // Write updated package.json back to disk
  await Bun.write(file, JSON.stringify(packageJson, null, 2))
  console.log(`Updated: ${file}`)
}

async function updatePackages() {
  const projectInfoText = await Bun.file('project-info.json').text()
  const projectInfo = JSON.parse(projectInfoText)

  const rootPackageText = await Bun.file('package.json').text()
  const rootPackage = JSON.parse(rootPackageText)

  for (const pattern of rootPackage.workspaces) {
    console.log(`Scanning workspace pattern: ${pattern}`)
    const glob = new Glob(pattern)

    for await (const file of glob.scan('.')) {
      if (file.endsWith('package.json')) {
        console.log(`Updating package.json: ${file}`)
        await updatePackageJson(file, projectInfo)
      } else if (file.endsWith('.ts')) {
        console.log(`Checking TypeScript file: ${file}`)
        const dirName = getDirName(file)
        const packageJsonPath = `${dirName}/package.json`
        if (Bun.file(packageJsonPath).size > 0) {
          const packageJsonText = await Bun.file(packageJsonPath).text()
          const packageJson = JSON.parse(packageJsonText)
          const projectName = packageJson.name.replace(/^@huly\//, '')
          const header = await generateTsHeader(file.split('/').pop() || '', projectName, projectInfo)
          await updateTsFile(file, header)
        }
      }
    }
  }
}

updatePackages().catch((error) => {
  console.error('Failed to update package.json files and .ts headers:', error)
})
