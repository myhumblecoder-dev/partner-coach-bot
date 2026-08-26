import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProfileContext } from './context'
import { prisma as db } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    },
  },
}))

describe('context', () => {
  beforeEach(() => {
    vi.mocked(db.profile.findUnique).mockClear()
  })

  it('returns null for an unknown profile', async () => {
    vi.mocked(db.profile.findUnique).mockResolvedValue(null)

    const result = await getProfileContext('unknown-id')

    expect(result).toBeNull()
  })

  it('maps relations to plain strings', async () => {
    const mockProfile = {
      id: 'profile-1',
      name: 'Ada',
      likes: [{ text: 'tea' }],
      dislikes: [{ text: 'coffee' }],
      jokes: [{ text: 'dad joke' }],
      dreams: [{ description: 'fly' }],
      gifts: [{ description: 'book' }],
      trips: [{ destination: 'Kyoto' }],
      moods: [{ label: 'Happy', note: 'sunny day', recordedAt: new Date(Date.UTC(2023, 1, 1)) }],
      events: [{ title: 'Birthday', note: 'big party', occurredAt: new Date(Date.UTC(2023, 1, 1)) }],
      // Add required fields for the mock to be valid for the mapper
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }

    vi.mocked(db.profile.findUnique).mockResolvedValue(mockProfile as any)

    const result = await getProfileContext('profile-1')

    expect(result).not.toBeNull()
    if (result) {
      expect(result.name).toBe('Ada')
      expect(result.likes).toEqual(['tea'])
      expect(result.dislikes).toEqual(['coffee'])
      expect(result.jokes).toEqual(['dad joke'])
      expect(result.dreams).toEqual(['fly'])
      expect(result.pastGifts).toEqual(['book'])
      expect(result.pastTrips).toEqual(['Kyoto'])
      expect(result.recentMoods).toEqual([{ label: 'Happy', note: 'sunny day' }])
      expect(result.recentEvents).toEqual([{ title: 'Birthday', note: 'big party' }])
    }
  })

  it('fetches everything in one query', async () => {
    vi.mocked(db.profile.findUnique).mockResolvedValue(null)

    await getProfileContext('profile-1')

    expect(db.profile.findUnique).toHaveBeenCalledTimes(1)
  })

  it('limits moods and events to ten, newest first', async () => {
    vi.mocked(db.profile.findUnique).mockResolvedValue(null)

    await getProfileContext('profile-1')

    const callArgs = vi.mocked(db.profile.findUnique).mock.calls[0][0]
    const include = callArgs.include

    expect(include).toBeDefined()
    // We use type assertion here because the mock return type is generic
    const actualInclude = include as any

    expect(actualInclude.moods).toEqual({
      orderBy: { recordedAt: 'desc' },
      take: 10,
    })
    expect(actualInclude.events).toEqual({
      orderBy: { occurredAt: 'desc' },
      take: 10,
    })
  })

  it('the study rides along', async () => {
    vi.mocked(db.profile.findUnique).mockResolvedValue({
      name: 'Yoyo',
      portraitSummary: 'She is a maker of order.',
      facets: [{ section: 'likes', label: 'order at home', evidenceCount: 3 }],
      likes: [], dislikes: [], jokes: [], dreams: [], trips: [],
      gifts: [{ description: 'record player', howItLanded: 'hit' }],
      moods: [], events: [], occasions: [],
    } as any)

    const context = await getProfileContext('p1')

    expect(context?.summary).toBe('She is a maker of order.')
    expect(context?.facets?.[0].label).toBe('order at home')
    expect(context?.giftRecord?.[0].howItLanded).toBe('hit')
  })

  it('timezone rides along', async () => {
    vi.mocked(db.profile.findUnique).mockResolvedValue({
      id: 'p2',
      name: 'Parisian',
      timezone: 'Europe/Paris',
      likes: [], dislikes: [], jokes: [], dreams: [], trips: [], gifts: [], moods: [], events: [],
      createdAt: new Date(0),
      updatedAt: new Date(0),
    } as any)

    const context = await getProfileContext('p2')

    expect(context).not.toBeNull()
    expect(context!.timezone).toBe('Europe/Paris')
  })
})
