import { describe, it, expect } from 'vitest'
import { dueOccasions, type OccasionInput } from './occasions'

describe('occasions', () => {
  it('an occasion inside the lead window is due', () => {
    const today = new Date(Date.UTC(2026, 7, 17)) // 2026-08-17
    const occasions: OccasionInput[] = [
      {
        id: '1',
        kind: 'birthday',
        label: 'Alice',
        month: 8,
        day: 20,
        leadTimeDays: 7,
      },
    ]
    // 20 Aug is within 7 days of 17 Aug (17, 18, 19, 20, 21, 22, 23)
    const result = dueOccasions(occasions, today)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('an occasion beyond the lead window is not due', () => {
    const today = new Date(Date.UTC(2026, 7, 1)) // 2026-08-01
    const occasions: OccasionInput[] = [
      {
        id: '1',
        kind: 'birthday',
        label: 'Alice',
        month: 8,
        day: 20,
        leadTimeDays: 7,
      },
    ]
    // 20 Aug is far beyond 1 Aug + 7 days
    const result = dueOccasions(occasions, today)
    expect(result).toHaveLength(0)
  })

  it('an occasion today is due', () => {
    const today = new Date(Date.UTC(2026, 7, 17)) // 2026-08-17
    const occasions: OccasionInput[] = [
      {
        id: '1',
        kind: 'birthday',
        label: 'Alice',
        month: 8,
        day: 17,
        leadTimeDays: 7,
      },
    ]
    const result = dueOccasions(occasions, today)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('a passed occasion rolls to next year', () => {
    const today = new Date(Date.UTC(2026, 11, 27)) // 2026-12-27
    const occasions: OccasionInput[] = [
      {
        id: '1',
        kind: 'birthday',
        label: 'Alice',
        month: 1,
        day: 3,
        leadTimeDays: 14,
      },
    ]
    // 3 Jan 2027 is within 14 days of 27 Dec 2026
    const result = dueOccasions(occasions, today)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('returns empty when nothing is approaching', () => {
    const today = new Date(Date.UTC(2026, 0, 1))
    const occasions: OccasionInput[] = []
    const result = dueOccasions(occasions, today)
    expect(result).toEqual([])
  })
})
