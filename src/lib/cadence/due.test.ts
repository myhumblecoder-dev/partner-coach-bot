import { describe, it, expect } from 'vitest'
import { dueCadences } from './due'

describe('due', () => {
  it('a plain weekday is daily only', () => {
    // 2026-08-18 is a Tuesday
    const date = new Date(Date.UTC(2026, 7, 18, 9, 0, 0))
    expect(dueCadences(date)).toEqual(['daily'])
  })

  it('Sunday adds weekly', () => {
    // 2026-08-23 is a Sunday
    const date = new Date(Date.UTC(2026, 7, 23, 9, 0, 0))
    expect(dueCadences(date)).toEqual(['daily', 'weekly'])
  })

  it('the first of the month adds monthly', () => {
    // 2026-09-01 is a Tuesday
    const date = new Date(Date.UTC(2026, 8, 1, 9, 0, 0))
    expect(dueCadences(date)).toEqual(['daily', 'monthly'])
  })

  it('a Sunday the first returns all three', () => {
    // 2026-11-01 is a Sunday
    const date = new Date(Date.UTC(2026, 10, 1, 9, 0, 0))
    expect(dueCadences(date)).toEqual(['daily', 'weekly', 'monthly'])
  })

  it('Tokyo Saturday UTC is Sunday locally fires weekly and monthly', () => {
    // 2026-10-31T15:00:00Z is Saturday UTC.
    // In Tokyo (UTC+9), this is 2026-11-01 00:00:00 (Sunday and 1st of month).
    const date = new Date(Date.UTC(2026, 9, 31, 15, 0, 0))
    expect(dueCadences(date, 'Asia/Tokyo')).toEqual(['daily', 'weekly', 'monthly'])
  })

  it('Saturday UTC without timezone does not fire weekly', () => {
    // 2026-10-31T15:00:00Z is Saturday UTC.
    const date = new Date(Date.UTC(2026, 9, 31, 15, 0, 0))
    expect(dueCadences(date)).toEqual(['daily'])
  })
})
