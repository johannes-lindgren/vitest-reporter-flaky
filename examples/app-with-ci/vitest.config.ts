import { defineConfig } from 'vitest/config'
import FlakinessReporter from 'vitest-reporter-flakiness'

export default defineConfig({
  test: {
    // Important: to be able to report flaky tests, you need to set a retry count.
    //  This is because a test is only considered flaky if it passed but had retries.
    retry: 3,
    reporters: [
      new FlakinessReporter({
        outputFile: 'reports/flaky-tests.json',
        // disableConsoleOutput: true,
        // onReport: (report) => {
        //   // Do something
        // },
      }),
    ],
  },
})
