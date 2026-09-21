import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/db'
import { generate } from '@/lib/ai'
import { getProfileContext, type ProfileContext } from '@/lib/profile/context'
import { extractFacts } from './extract'

vi.mock('@/lib/db', () => ({
  prisma: {
    likesEntry: { create: vi.fn() },
    dislikesEntry: { create: vi.fn() },
    joke: { create: vi.fn() },
    mood: { create: vi.fn() },
    dream: { create: vi.fn() },
    event: { create: vi.fn() },
    gift: { create: vi.fn() },
    trip: { create: vi.fn() },
    occasion: { create: vi.fn(), findMany: vi.fn() },
    cycleLog: { updateMany: vi.fn(), create: vi.fn() },
  },
}))
vi.mock('@/lib/ai', () => ({ generate: vi.fn() }))
vi.mock('@/lib/profile/context', () => ({ getProfileContext: vi.fn() }))
// prompt and parse are pure local modules — never mocked.

const base: ProfileContext = {
  name: 'Ada',
  likes: [],
  dislikes: [],
  jokes: [],
  dreams: [],
  recentMoods: [],
  recentEvents: [],
  pastGifts: [],
  pastTrips: [],
}

const CREATES = () => [
  prisma.likesEntry.create, prisma.dislikesEntry.create, prisma.joke.create,
  prisma.mood.create, prisma.dream.create, prisma.event.create,
  prisma.gift.create, prisma.trip.create,
]

describe('extractFacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getProfileContext).mockResolvedValue(base)
    for (const fn of CREATES()) vi.mocked(fn).mockResolvedValue({} as never)
    vi.mocked(prisma.occasion.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.occasion.create).mockResolvedValue({} as never)
    vi.mocked(prisma.cycleLog.updateMany).mockResolvedValue({ count: 0 } as never)
    vi.mocked(prisma.cycleLog.create).mockResolvedValue({} as never)
  })

  it('writes an extracted like with provenance', async () => {
    vi.mocked(generate).mockResolvedValue('{"likes": ["the thai place"]}')

    await expect(extractFacts('p1', 'she loved the thai place')).resolves.toBe(1)

    expect(prisma.likesEntry.create).toHaveBeenCalledWith({
      data: { profileId: 'p1', text: 'the thai place', source: 'extracted' },
    })
  })

  it('unknown profile writes nothing', async () => {
    vi.mocked(getProfileContext).mockResolvedValue(null)

    await expect(extractFacts('p1', 'hi')).resolves.toBe(0)
    expect(generate).not.toHaveBeenCalled()
  })

  it('empty extraction writes nothing', async () => {
    vi.mocked(generate).mockResolvedValue('{}')

    await expect(extractFacts('p1', 'hi')).resolves.toBe(0)
    for (const fn of CREATES()) expect(fn).not.toHaveBeenCalled()
  })

  it('counts across fields', async () => {
    vi.mocked(generate).mockResolvedValue(
      '{"moods": ["stressed"], "trips": ["Portugal"]}')

    await expect(extractFacts('p1', 'rough week, dreaming of Portugal')).resolves.toBe(2)

    expect(prisma.mood.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ label: 'stressed' }) }))
    expect(prisma.trip.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ destination: 'Portugal' }) }))
  })

  it('stores a stated birthday once', async () => {
    vi.mocked(generate).mockResolvedValue(
      '{"occasions": [{"kind": "birthday", "label": "her birthday", "month": 9, "day": 4}]}')

    await expect(extractFacts('p1', 'her birthday is September 4th')).resolves.toBe(1)
    expect(prisma.occasion.create).toHaveBeenCalledWith({
      data: { profileId: 'p1', kind: 'birthday', label: 'her birthday', month: 9, day: 4 },
    })

    // Same date mentioned again: the hard dedupe holds.
    vi.mocked(prisma.occasion.findMany).mockResolvedValue(
      [{ kind: 'birthday', label: 'Her Birthday', month: 9, day: 4 }] as never)
    await expect(extractFacts('p1', 'her birthday is Sept 4')).resolves.toBe(0)
  })

  describe('the cycle', () => {
    // The offset is resolved against the clock, so the clock is pinned.
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-09-21T13:45:00Z'))
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    const whereOf = () =>
      vi.mocked(prisma.cycleLog.updateMany).mock.calls[0][0].where as Record<string, unknown>

    it('creates the row on the first reported start', async () => {
      vi.mocked(generate).mockResolvedValue('{"cycle": {"daysAgo": 2}}')

      await expect(extractFacts('p1', 'she started her period on Saturday'))
        .resolves.toBe(1)

      expect(prisma.cycleLog.create).toHaveBeenCalledWith({
        data: { profileId: 'p1', lastPeriodStart: new Date('2026-09-19T00:00:00Z') },
      })
      // A state, never a history: nothing is appended anywhere.
      for (const fn of CREATES()) expect(fn).not.toHaveBeenCalled()
    })

    it('updates the one row without reading it first', async () => {
      vi.mocked(prisma.cycleLog.updateMany).mockResolvedValue({ count: 1 } as never)
      vi.mocked(generate).mockResolvedValue('{"cycle": {"daysAgo": 0}}')

      await expect(extractFacts('p1', 'her period started today')).resolves.toBe(1)

      expect(prisma.cycleLog.updateMany).toHaveBeenCalledTimes(1)
      expect(prisma.cycleLog.create).not.toHaveBeenCalled()
      expect(vi.mocked(prisma.cycleLog.updateMany).mock.calls[0][0].data)
        .toEqual({ lastPeriodStart: new Date('2026-09-21T00:00:00Z') })
    })

    it('resolves the offset in the profile timezone', async () => {
      vi.mocked(getProfileContext).mockResolvedValue(
        { ...base, timezone: 'America/New_York' })
      vi.mocked(prisma.cycleLog.updateMany).mockResolvedValue({ count: 1 } as never)
      vi.mocked(generate).mockResolvedValue('{"cycle": {"daysAgo": 0}}')
      // 01:30 UTC on the 22nd is still the 21st in New York.
      vi.setSystemTime(new Date('2026-09-22T01:30:00Z'))

      await extractFacts('p1', 'her period started today')

      expect(vi.mocked(prisma.cycleLog.updateMany).mock.calls[0][0].data)
        .toEqual({ lastPeriodStart: new Date('2026-09-21T00:00:00Z') })
    })

    it('guards the write in the query, not in TS', async () => {
      vi.mocked(prisma.cycleLog.updateMany).mockResolvedValue({ count: 1 } as never)
      vi.mocked(generate).mockResolvedValue('{"cycle": {"daysAgo": 2}}')

      await extractFacts('p1', 'she started Saturday')

      const where = whereOf()
      const start = new Date('2026-09-19T00:00:00Z')
      // Newer wins, an identical date is excluded, and a correction is
      // allowed only for a row written within the window.
      expect(where.profileId).toBe('p1')
      expect(where.lastPeriodStart).toEqual({ not: start })
      expect(where.OR).toEqual([
        { lastPeriodStart: { lt: start } },
        { updatedAt: { gte: new Date('2026-09-20T00:00:00Z') } },
      ])
    })

    it('a refused report leaves the stored date alone', async () => {
      // Nothing matched the guard AND the row already exists: the create
      // hits the unique constraint and the stored date stands.
      vi.mocked(prisma.cycleLog.updateMany).mockResolvedValue({ count: 0 } as never)
      vi.mocked(prisma.cycleLog.create).mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`profileId`)'))
      vi.mocked(generate).mockResolvedValue('{"cycle": {"daysAgo": 20}}')

      await expect(extractFacts('p1', 'she started a few weeks back'))
        .resolves.toBe(0)
    })

    it('touches nothing when the model reports no start', async () => {
      vi.mocked(generate).mockResolvedValue('{"moods": ["crampy"], "cycle": null}')

      await extractFacts('p1', 'she has cramps today')

      expect(prisma.cycleLog.updateMany).not.toHaveBeenCalled()
      expect(prisma.cycleLog.create).not.toHaveBeenCalled()
      expect(prisma.mood.create).toHaveBeenCalled()
    })
  })
})
