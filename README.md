<div align="center">
  <h1 align="center">vite-reporter-flakiness</h1>
  <p align="center">
   Identify and report flaky tests
  </p>
</div>

<p align="center">
<a href="https://github.com/johannes-lindgren/vite-reporter-flakiness/actions/workflows/code-integration-checks.yml" rel="nofollow"><img src="https://img.shields.io/badge/Tests-passing-yellow0green.svg" alt="Tests CI stats"></a>
<a href="https://opensource.org/licenses/MIT" rel="nofollow"><img src="https://img.shields.io/badge/Licence-MIT-green" alt="License"></a>
<a href="https://github.com/johannes-lindgren" rel="nofollow"><img src="https://img.shields.io/badge/Author-@johannes--lindgren-blue.svg" alt="Created by Johannes Lindgren"></a>
</p>

This package provides a Vitest reporter that identifies and reports flaky tests.

A test is considered flaky if it fails in at least one run and passes in a retry run.

## Getting Started

Install the package:

```bash
npm install vite-reporter-flakiness --save-dev
```

Ensure that you have retries enabled in your Vitest configuration for the reporter to work effectively:

```js// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Adjust the number of retries as needed
    retries: 2,
  },
})
```

Add the reporter to your Vitest configuration:

```js
// vitest.config.js
import { defineConfig } from 'vitest/config'
import { FlakinessReporter } from 'vite-reporter-flakiness'

export default defineConfig({
  test: {
    reporters: [
      new FlakinessReporter({
        outputFile: 'reports/flaky-tests-report.json',
      }),
    ],
  },
})
```

In CI, trigger an alert if the reporter generated the report file; for example, in GitHub actions, the workflow
could include a step like this:

```yaml
- name: Report flaky tests
  run: |
    echo "=== Running flakiness reporter ==="
    # Simulate flakiness detection (replace with actual command)
    if [ -f "examples/app-with-ci/reports/flaky-tests.json" ]; then
      echo "Flaky tests detected:"
      # TODO: this is where you would want to send a notification or create an issue based on the flakiness report.
      echo "Artifacts: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"
    else
      echo "No flaky tests detected."
    fi
- name: Upload flaky test report artifact
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: flaky-tests-report
    path: examples/app-with-ci/reports/flaky-tests.json
    if-no-files-found: ignore
```

## Examples

See the examples here:

- [Example app](https://github.com/johannes-lindgren/vitest-reporter-flakiness/blob/main/examples/app-with-ci/vitest.config.ts)
- [Example workflow](https://github.com/johannes-lindgren/vitest-reporter-flakiness/blob/main/.github/workflows/example.yml)

<br/>
<div align="center">
  <em>By <a href="https://github.com/johannes-lindgren">@johannes-lindgren</a></em>
</div>
