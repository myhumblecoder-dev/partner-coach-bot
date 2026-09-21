import { describe, it, expect } from 'vitest'
import { startDateFromDaysAgo, daysSinceStart } from './day'

describe('startDateFromDaysAgo', () => {
  it('zero days ago is UTC midnight of today', () => {
    const now = new Date('2026-09-21T13:45:00Z')

    expect(startDateFromDaysAgo(now, 0).toISOString()).toBe(
      '2026-09-21T00:00:00.000Z'
    )
  })

  it('counts back whole days', () => {
    const now = new Date('2026-09-21T13:45:00Z')

    expect(startDateFromDaysAgo(now, 14).toISOString()).toBe(
      '2026-09-07T00:00:00.000Z'
    )
  })

  it('crosses a month boundary', () => {
    const now = new Date('2026-03-02T09:00:00Z')

    expect(startDateFromDaysAgo(now, 5).toISOString()).toBe(
      '2026-02-25T00:00:00.000Z'
    )
  })

  it('anchors on the local day, not the UTC day', () => {
    // 01:30 UTC on the 21st is still the evening of the 20th in New York —
    // a period reported as starting "today" started on the 20th.
    const now = new Date('2026-09-21T01:30:00Z')

    expect(
      startDateFromDaysAgo(now, 0, 'America/New_York').toISOString()
    ).toBe('2026-09-20T00:00:00.000Z')
  })
})

describe('daysSinceStart', () => {
  it('counts the days since the recorded start', () => {
    const start = new Date('2026-09-07T00:00:00Z')
    const now = new Date('2026-09-21T13:45:00Z')

    expect(daysSinceStart(start, now)).toBe(14)
  })

  it('a start recorded today is day zero', () => {
    const start = new Date('2026-09-21T00:00:00Z')
    const now = new Date('2026-09-21T23:59:00Z')

    expect(daysSinceStart(start, now)).toBe(0)
  })

  it('uses local days when a timezone is given', () => {
    const start = new Date('2026-09-20T00:00:00Z')
    const now = new Date('2026-09-21T01:30:00Z')

    // Still the 20th in New York, so no day has passed.
    expect(daysSinceStart(start, now, 'America/New_York')).toBe(0)
    // Already the 21st in UTC.
    expect(daysSinceStart(start, now)).toBe(1)
  })

  it('never reads a future start as a countdown', () => {
    const start = new Date('2026-10-01T00:00:00Z')
    const now = new Date('2026-09-21T13:45:00Z')

    expect(daysSinceStart(start, now)).toBe(0)
  })
})
