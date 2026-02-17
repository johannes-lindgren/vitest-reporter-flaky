import { describe, it, expect } from 'vitest'

describe('flaky tests', () => {
  // To simulate a flaky test, we can use a counter that increments each time the test runs. The test will only pass after a certain number of runs, which will cause it to be reported as flaky by the reporter.
  let testCounter = 0
  it('is a flaky test', () => {
    // This test will be reported
    testCounter++
    expect(testCounter).toBeGreaterThan(2)
  })
  it('is not a flaky test', () => {
    // This test will not be reported
    expect(true).toBe(true)
  })
})
