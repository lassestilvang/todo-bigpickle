import { describe, expect, it } from 'bun:test'

function fireKey(key: string) {
  return key
}

describe('test', () => {
  it('works', () => {
    expect(fireKey('a')).toBe('a')
  })
})
