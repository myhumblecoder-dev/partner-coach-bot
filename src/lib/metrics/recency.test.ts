import { describe, it, expect } from 'vitest'
import { daysSinceLastTouch } from './recency'

describe('recency', () => {
  it('days since the latest date', () => {
    const dates = [
      new Date(Date.UTC(2026, 7, 10)), // 2026-08-10
      new Date(Date.UTC(2026, 7, 15)), // 2026-08-15
    ]
    const today = new Date(Date.UTC(2026, 7, 18)) // 2026-08-18
    
    const result = daysSinceLastTouch(dates, today)
    expect(result).toBe(3)
  })

  it('empty history is null', () => {
    const today = new Date(Date.UTC(2026, 7, 18))
    const result = daysSinceLastTouch([], today)
    expect(result).toBeNull()
  })

  it('a touch today is zero', () => {
    const dates = [new Date(Date.UTC(2026, 7, 18, 9, 0, 0))]
    const today = new Date(Date.UTC(2026, 7, 18, 12, 0, 0))
    
    const result = daysSinceLastTouch(dates, today)
    expect(result).toBe(0)
  })
})
