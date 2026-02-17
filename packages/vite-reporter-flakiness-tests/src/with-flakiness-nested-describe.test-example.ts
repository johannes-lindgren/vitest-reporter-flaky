import { describe, it, expect } from 'vitest'

describe('flaky tests', () => {
  describe('nested test', () => {
    let testCounter = 0
    it('is a flaky test', () => {
      testCounter++
      expect(testCounter).toBeGreaterThan(2)
    })
  })
})
