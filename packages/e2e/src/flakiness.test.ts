import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
const execAsync = promisify(exec)
import FlakinessReporter from 'vite-reporter-flakiness'
import { defineConfig } from 'vitest/config'
import { startVitest } from 'vitest/node'
import { describe, expect, it } from 'vitest'

const outputFolder = 'test-results'

async function runVitest(testName: string) {
  const id = Math.random().toString().slice(2, 8)
  const reportName = `flaky-tests_${id}.json`
  const outputFile = path.resolve(outputFolder, reportName)
  const vitest = await startVitest(
    'test',
    [testName],
    {},
    defineConfig({
      test: {
        retry: 3,
        reporters: [
          new FlakinessReporter({
            outputFile: outputFile,
            pretty: true,
          }),
        ],
      },
    }),
  )

  await vitest?.close()
  return outputFile
}

const doesFileExist = async (filePath: string) => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const withFlakiness = 'with-flakiness.exampletest.ts'
const withoutFlakiness = 'without-flakiness.exampletest.ts'

describe('flakiness reporting', () => {
  it('creates a file when there is a flaky test', async () => {
    const outputFile = await runVitest(withFlakiness)
    console.log('outputFile', outputFile)
    expect(await doesFileExist(outputFile)).toBe(true)
  })
})

// const jsonContent = await fs.readFile(
//   path.resolve('./test-results/flaky-tests.json'),
//   'utf8',
// )
// const report = JSON.parse(jsonContent)
