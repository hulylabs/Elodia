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

function joinPath(...segments: string[]): string {
  return segments.join('/')
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

  // Ensure that we scan from the project's root directory
  const projectRoot = process.cwd()

  for (const workspace of rootPackage.workspaces) {
    const workspaceGlob = `${workspace}/**/*` // Modified to use recursive glob pattern
    console.log(`Scanning workspace pattern: ${workspaceGlob}`)
    const glob = new Glob(workspaceGlob) // Use the modified pattern here

    for await (const file of glob.scan({ cwd: projectRoot })) {
      const relativePath = file.replace(projectRoot + '/', '') // Remove the root path

      // If we found a package.json file, update it
      if (relativePath.endsWith('package.json')) {
        console.log(`Updating package.json: ${relativePath}`)
        await updatePackageJson(file, projectInfo)
      }

      // If we found a `.ts` file, update its header
      else if (relativePath.endsWith('.ts')) {
        console.log(`Updating TypeScript file: ${relativePath}`)
        const dirName = getDirName(relativePath)
        const packageJsonPath = `${dirName}/package.json`
        const packageJsonFile = Bun.file(joinPath(projectRoot, packageJsonPath))

        if (packageJsonFile.size > 0) {
          const packageJsonText = await packageJsonFile.text()
          const packageJson = JSON.parse(packageJsonText)
          const projectName = packageJson.name.replace(/^@huly\//, '')
          const header = await generateTsHeader(relativePath.split('/').pop() || '', projectName, projectInfo)
          await updateTsFile(file, header)
        }
      }
    }
  }
}

updatePackages().catch((error) => {
  console.error('Failed to update package.json files and .ts headers:', error)
})
