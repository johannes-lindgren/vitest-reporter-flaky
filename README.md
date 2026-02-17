<div align="center">
  <h1 align="center">vitest-reporter-flakiness</h1>
  <p align="center">
   Identify and report flaky tests
  </p>
</div>

<p align="center">
<a href="https://github.com/johannes-lindgren/vitest-reporter-flakiness/actions/workflows/code-integration-checks.yml" rel="nofollow"><img src="https://img.shields.io/badge/Tests-passing-yellow0green.svg" alt="Tests CI stats"></a>
<a href="https://opensource.org/licenses/MIT" rel="nofollow"><img src="https://img.shields.io/badge/Licence-MIT-green" alt="License"></a>
<a href="https://github.com/johannes-lindgren" rel="nofollow"><img src="https://img.shields.io/badge/Author-@johannes--lindgren-blue.svg" alt="Created by Johannes Lindgren"></a>
</p>

This package provides a Vitest reporter that identifies and reports flaky tests.

A test is considered flaky if it fails in at least one run and passes in a retry run.

## Getting Started

Install the package:

```bash
npm install vitest-reporter-flakiness --save-dev
```

Add the reporter to your Vitest configuration. Ensure that you have retries enabled in your Vitest configuration for the reporter to work effectively:

```ts
// vitest.config.js
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
      }),
    ],
  },
})
```

In CI, trigger an alert if the reporter generated the report file; for example, in GitHub actions, the workflow
could include steps like this:

```yaml
- name: Run tests
  run: npm test
- name: Report flaky tests
  run: |
    if [ -f "reports/flaky-tests.json" ]; then
      # TODO: this is where you would want to send a notification or create an issue based on the flakiness report.
      echo "Artifacts: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"
    fi
- name: Upload flaky test report artifact
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: flaky-tests-report
    path: reports/flaky-tests.json
    if-no-files-found: ignore
```

## Examples

See the examples here:

- [Example app](https://github.com/johannes-lindgren/vitest-reporter-flakiness/blob/main/examples/app-with-ci/vitest.config.ts)
- [Example workflow](https://github.com/johannes-lindgren/vitest-reporter-flakiness/blob/main/.github/workflows/example.yml)

## API

The `FlakinessReporter` accepts an options object with the following (optional) properties:

- `outputFile` (`string`): The path to the output file where the flakiness report will be saved.
- `disableConsoleOutput` (`boolean`): If set to `true`, the reporter will not output flaky test information to the console. Default is `false`.
- `onReport` (`(report: Report) => void`): A callback function that will be called with the

<br/>
<div align="center">
  <em>By <a href="https://github.com/johannes-lindgren">@johannes-lindgren</a></em>
</div>
