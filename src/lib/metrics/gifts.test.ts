import { describe, it, expect } from 'vitest'
import { giftStats } from './gifts'

describe('gifts', () => {
  it('counts hits misses and unrated', () => {
    const input = [
      { howItLanded: 'hit' },
      { howItLanded: 'hit' },
      { howItLanded: 'miss' },
      { howItLanded: null },
    ]
    const stats = giftStats(input)

    expect(stats.logged).toBe(4)
    expect(stats.hits).toBe(2)
    expect(stats.misses).toBe(1)
    expect(stats.unrated).toBe(1)
    expect(stats.successRate).toBe(2 / 3)
  })

  it('no rated gifts means null success rate', () => {
    const input = [{ howItLanded: null }]
    const stats = giftStats(input)

    expect(stats.unrated).toBe(1)
    expect(stats.successRate).toBe(null)
  })

  it('empty list is all zeros', () => {
    const stats = giftStats([])

    expect(stats.logged).toBe(0)
    expect(stats.hits).toBe(0)
    expect(stats.misses).toBe(0)
    expect(stats.unrated).toBe(0)
    expect(stats.successRate).toBe(null)
  })
})
