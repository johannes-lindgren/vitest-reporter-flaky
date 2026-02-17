import { describe, it, expect } from 'vitest'

describe('Failing tests', () => {
  it('always fails', () => {
    expect(false).toEqual(true)
  })
})
