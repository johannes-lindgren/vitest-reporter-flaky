import { describe, it, expect } from 'vitest'

describe('flaky tests', () => {
  let testCounter = 0
  it('is a flaky test', () => {
    testCounter++
    expect(testCounter).toBeGreaterThan(2)
  })
  // it('should not report a stable test', () => {
  //   expect(true).toBe(true)
  // })
  // it('should not report a consistently failing test', () => {
  //   expect(false).toBe(true)
  // })
  // describe('nested test', () => {
  //   let testCounter = 0
  //
  //   it('should also report flaky tests in nested describes', () => {
  //     testCounter++
  //     expect(testCounter).toBeGreaterThan(544)
  //   })
  // })
})
