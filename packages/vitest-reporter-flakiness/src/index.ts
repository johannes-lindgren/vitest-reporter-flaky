import type { TaskResultPack } from '@vitest/runner'
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Reporter, TestCase, TestModule, TestSuite } from 'vitest/node'

const packageName = 'vitest-reporter-flakiness'

const printReport = (report: Report) => {
  if (report.flakyTests.length === 0) {
    // Don't print anything. A "success" could be misleading, since the report will only report flaky tests and don't care about whether the test suit failed or not.
    return
  }

  console.warn(
    `⚠️ [${packageName}] Found ${report.flakyTests.length} flaky test(s):`,
  )
  for (const flakyTest of report.flakyTests) {
    console.warn(
      `- ${flakyTest.moduleName} > ${[
        ...flakyTest.suitePath,
        flakyTest.testName,
      ]
        .map((it) => JSON.stringify(it))
        .join(' > ')} (retries: ${flakyTest.retries})`,
    )
  }
}

const writeReport = (report: Report, outputFile: string) => {
  // Make it human-readable by pretty-printing the JSON with an indentation of 2 spaces
  const content = JSON.stringify(report, null, 2)
  const filePath = path.resolve(outputFile)
  // Ensure directory exists
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, {
    encoding: 'utf8',
  })
}

type TaskResult = Exclude<TaskResultPack[1], undefined>

type TestTask = {
  type: 'test'
  name: string
  result: TaskResult
}

type SuiteTask = {
  type: 'suite'
  name: string
}

type ModuleTask = {
  type: 'module'
  name: string
}

/**
 * The `task` property is not defined in the types, but exists at runtime.
 * @param test
 */
const getTestTask = (test: TestCase): Extract<TestTask, { type: 'test' }> => {
  return (test as unknown as { task: TestTask }).task
}

const getSuiteTask = (
  test: TestSuite,
): Extract<SuiteTask, { type: 'suite' }> => {
  return (test as unknown as { task: SuiteTask }).task
}

const getModuleTask = (
  test: TestModule,
): Extract<ModuleTask, { type: 'module' }> => {
  return (test as unknown as { task: ModuleTask }).task
}

/**
 * Returns the module name, suite path and test name for a given test case.
 * @example
 * For example "test('should do something', () => {})" in "describe('my suite', () => {})" in "my-module.test.ts" would return:
 * ```
 * {
 *   moduleName: 'my-module.test.ts',
 *   suitePath: ['my suite'],
 *   testName: 'should do something',
 * }
 * ```
 * @param test
 */
const getTestPath = (
  test: TestCase,
): Pick<FlakyTest, 'testName' | 'suitePath' | 'moduleName'> => {
  const getParentPath = (
    test: TestSuite | TestModule,
  ): Pick<FlakyTest, 'moduleName' | 'suitePath'> => {
    if (test.type === 'module') {
      // Reached end of hierarchy
      return {
        moduleName: getModuleTask(test).name,
        suitePath: [],
      }
    } else {
      const suiteName = getSuiteTask(test).name
      const parent = test.parent
      const parentPath = getParentPath(parent)
      return {
        moduleName: parentPath.moduleName,
        suitePath: [...parentPath.suitePath, suiteName],
      }
    }
  }

  return {
    ...getParentPath(test.parent),
    testName: getTestTask(test).name,
  }
}

/**
 * A test is considered flaky if it passed but had retries.
 * @param task
 */
const isFlaky = (task: TaskResult): boolean => {
  const retries = task.retryCount ?? 0
  return task.state === 'pass' && retries > 0
}

export type FlakyTest = {
  moduleName: string
  // The last element of the path is the test name, the rest are suite names
  suitePath: string[]
  testName: string
  retries: number
}

export type Report = {
  flakyTests: FlakyTest[]
}

export type FlakyTestsReporterOptions = {
  /**
   * If specified, the reporter will write a report to the given file path if flaky tests were found.
   */
  outputFile?: string

  /**
   * Callback that is called with the report data after the test run has ended. This can be used to do custom processing of the report data, or to send it to an external service instead of writing it to a file.
   * If specified, this function is always called with the report data, even if no flaky tests were found. In that case, the `flakyTests` array in the report will be empty.
   */
  onReport?: (data: Report) => void
  /**
   * Disables all console output, including warnings about retry not being set and the report of flaky tests.
   */
  disableConsoleOutput?: boolean
}

// Not exported by vitest
type Vitest = Parameters<Exclude<Reporter['onInit'], undefined>>[0]

class Index implements Reporter {
  private options: FlakyTestsReporterOptions

  constructor(options: FlakyTestsReporterOptions = {}) {
    this.options = options
  }

  onInit(vitest: Vitest) {
    const anyRetry0 = vitest.projects?.some(
      (project) => (project?.globalConfig?.retry ?? 0) < 1,
    )

    if (anyRetry0 && !this.options.disableConsoleOutput) {
      console.warn(
        `⚠️ [${packageName}] Warning: \`test.retry\ in the vitest configuration is set to 0, which means that flaky tests will not be detected. Please set retry to a value greater than 0 in your Vitest config.`,
      )
    }
  }

  onTestRunEnd(testModules: ReadonlyArray<TestModule>) {
    const flakyTests: FlakyTest[] = []
    for (const module of testModules) {
      for (const test of module.children.allTests()) {
        const task = getTestTask(test)
        const retries = task.result.retryCount ?? 0
        if (isFlaky(task.result)) {
          const path = getTestPath(test)
          flakyTests.push({
            ...path,
            retries,
          })
        }
      }
    }

    const report = {
      flakyTests,
    }

    const foundFlakyTests = flakyTests.length > 0
    if (foundFlakyTests && this.options.outputFile) {
      writeReport(report, this.options.outputFile)
    }
    if (!this.options.disableConsoleOutput) {
      printReport(report)
    }
    this.options.onReport?.(report)
  }
}

// Should be the default export, so that you can run with `vitest --reporter=./.vitest/flaky-tests-reporter.ts`
export default Index
