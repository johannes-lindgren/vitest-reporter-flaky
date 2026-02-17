import { describe, it, expect } from 'vitest'

let testCounter = 0
it('is a flaky test', () => {
  testCounter++
  expect(testCounter).toBeGreaterThan(2)
})
