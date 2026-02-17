import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import FlakinessReporter from 'vitest-reporter-flakiness'
import type { FlakyTestsReporterOptions } from 'vitest-reporter-flakiness'
import { defineConfig } from 'vitest/config'
import { startVitest } from 'vitest/node'
import { describe, expect, it, test, afterAll, vi } from 'vitest'

const outputFolder = 'tmp-test-results'

async function runVitest(testName: string, options: FlakyTestsReporterOptions) {
  const vitest = await startVitest(
    'test',
    [testName],
    {},
    defineConfig({
      test: {
        include: ['**/*.test-example.ts'],
        testTimeout: 20,
        retry: 3,
        reporters: [new FlakinessReporter(options)],
      },
    }),
  )
  await vitest?.close()
}

const doesFileExist = async (filePath: string) => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const readReport = async (filePath: string) => {
  const jsonContent = await fs.readFile(filePath, 'utf8')
  return JSON.parse(jsonContent)
}

const withFlakiness = 'with-flakiness.test-example.ts'
const withFlakinessNestedDescribe =
  'with-flakiness-nested-describe.test-example.ts'
const withFlakinessNoDescribe = 'with-flakiness-no-describe.test-example.ts'
const alwaysSuccessful = 'always-successful.test-example.ts'
const alwaysFailing = 'always-failing.test-example.ts'

const getOutputFilePath = () => {
  const id = Math.random().toString().slice(2, 8)
  const reportName = `tmp_${id}.json`
  return path.resolve(outputFolder, reportName)
}

describe('flakiness reporting', () => {
  describe('file output', () => {
    describe('non-flaky tests', () => {
      test('successful tests', async () => {
        const outputFile = getOutputFilePath()
        await runVitest(alwaysSuccessful, { outputFile })
        expect(await doesFileExist(outputFile)).toBe(false)
      })
      test('failing tests', async () => {
        const outputFile = getOutputFilePath()
        await runVitest(alwaysFailing, { outputFile })
        expect(await doesFileExist(outputFile)).toBe(false)
      })
    })
    it('creates a file when there is a flaky test', async () => {
      const outputFile = getOutputFilePath()
      await runVitest(withFlakiness, { outputFile })
      expect(await doesFileExist(outputFile)).toBe(true)
    })
    test('that the file contains the report', async () => {
      const outputFile = getOutputFilePath()
      await runVitest(withFlakiness, { outputFile })
      const report = await readReport(outputFile)
      expect(report).toHaveProperty('flakyTests')
      expect(report.flakyTests.length).toBeGreaterThan(0)
    })
    afterAll(async () => {
      try {
        await fs.rm(outputFolder, { recursive: true, force: true })
      } catch (err) {
        // Ignore errors if folder does not exist
      }
    })
  })
  describe('callback API', () => {
    describe('calling the callback under all circumstances', () => {
      it('calls the callback when there is a flaky test', async () => {
        const callback = vi.fn()
        await runVitest(withFlakiness, { onReport: callback })
        expect(callback).toHaveBeenCalled()
      })
      it('calls the callback for failing suites', async () => {
        const callback = vi.fn()
        await runVitest(alwaysFailing, { onReport: callback })
        expect(callback).toHaveBeenCalled()
      })
      it('calls the callback for successful suites', async () => {
        const callback = vi.fn()
        await runVitest(alwaysSuccessful, { onReport: callback })
        expect(callback).toHaveBeenCalled()
      })
    })
    test('that the callback receives the report', async () => {
      const callback = vi.fn()
      await runVitest(withFlakiness, { onReport: callback })
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          flakyTests: expect.any(Array),
        }),
      )
    })
  })
  describe('the report structure', () => {
    it('contains the test name', async () => {
      const callback = vi.fn()
      await runVitest(withFlakiness, { onReport: callback })
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          flakyTests: expect.arrayContaining([
            expect.objectContaining({
              testName: 'is a flaky test',
            }),
          ]),
        }),
      )
    })
    describe('the suite path', () => {
      test('that the suite path is empty when there is no describe', async () => {
        const callback = vi.fn()
        await runVitest(withFlakinessNoDescribe, { onReport: callback })
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            flakyTests: expect.arrayContaining([
              expect.objectContaining({
                suitePath: [],
              }),
            ]),
          }),
        )
      })
      it('contains the suite path when there is a single', async () => {
        const callback = vi.fn()
        await runVitest(withFlakiness, { onReport: callback })
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            flakyTests: expect.arrayContaining([
              expect.objectContaining({
                suitePath: ['flaky tests'],
              }),
            ]),
          }),
        )
      })
      it('contains the full suite path for nested describes', async () => {
        const callback = vi.fn()
        await runVitest(withFlakinessNestedDescribe, { onReport: callback })
        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            flakyTests: expect.arrayContaining([
              expect.objectContaining({
                suitePath: ['flaky tests', 'nested test'],
              }),
            ]),
          }),
        )
      })
    })
    it('contains the module name', async () => {
      const callback = vi.fn()
      await runVitest(withFlakiness, { onReport: callback })
      const testFilePath = path.resolve(__dirname, withFlakiness)
      const expectedModuleName = path.relative(process.cwd(), testFilePath)
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          flakyTests: expect.arrayContaining([
            expect.objectContaining({
              moduleName: expectedModuleName,
            }),
          ]),
        }),
      )
    })
  })
})
