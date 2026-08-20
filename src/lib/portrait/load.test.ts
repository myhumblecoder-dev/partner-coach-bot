import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPortrait } from './load'
import { prisma } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    },
  },
}))

describe('load', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null for an\nunknown profile', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null as any)

    const result = await getPortrait('unknown-id')

    expect(result).toBeNull()
  })

  it('maps text rows to plain strings', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      name: 'Ada',
      likes: [{ text: 'tea' } as any],
      dislikes: [],
      jokes: [],
      dreams: [{ description: 'a cabin' } as any],
      moods: [],
      events: [],
      gifts: [],
      trips: [],
      occasions: [],
    } as any)

    const result = await getPortrait('ada-id')

    expect(result?.likes).toEqual(['tea'])
    expect(result?.dreams).toEqual(['a cabin'])
  })

  it('keeps mood fields for the timeline', async () => {
    const date = new Date(Date.UTC(2026, 7, 1, 0, 0, 0))
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      name: 'Ada',
      likes: [],
      dislikes: [],
      jokes: [],
      dreams: [],
      moods: [{ label: 'happy', note: null, recordedAt: date } as any],
      events: [],
      gifts: [],
      trips: [],
      occasions: [],
    } as any)

    const result = await getPortrait('ada-id')

    expect(result?.moods[0].label).toBe('happy')
    expect(result?.moods[0].recordedAt.getUTCFullYear()).toBe(2026)
    expect(result?.moods[0].recordedAt.getUTCMonth()).toBe(7)
    expect(result?.moods[0].recordedAt.getUTCDate()).toBe(1)
  })

  it('fetches everything in one query', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null as any)

    await getPortrait('ada-id')

    expect(prisma.profile.findUnique).toHaveBeenCalledTimes(1)
    expect(prisma.profile.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ada-id' },
        include: expect.objectContaining({
          moods: { orderBy: { recordedAt: 'asc' } },
          events: { orderBy: { occurredAt: 'desc' }, take: 20 },
        }),
      }),
    )
  })
})

it('entries carry ids and provenance', async () => {
  vi.mocked(prisma.profile.findUnique).mockResolvedValue({
    name: 'Ada',
    likes: [{ id: 'l1', text: 'tea', source: 'extracted' }],
    dislikes: [], jokes: [], dreams: [],
    trips: [{ id: 't1', destination: 'Kyoto', source: 'manual' }],
    gifts: [], occasions: [], moods: [], events: [],
  } as never)

  const portrait = await getPortrait('p1')

  expect(portrait?.entries?.likes[0]).toEqual(
    { id: 'l1', text: 'tea', source: 'extracted' })
  expect(portrait?.entries?.trips[0].text).toBe('Kyoto')
})

it('facets and summary ride along', async () => {
  vi.mocked(prisma.profile.findUnique).mockResolvedValue({
    name: 'Yoyo',
    portraitSummary: 'She is a maker of order.',
    facets: [{ id: 'f1', section: 'likes', label: 'order at home', status: 'active', evidenceCount: 4 }],
    likes: [], dislikes: [], jokes: [], dreams: [],
    trips: [], gifts: [], occasions: [], moods: [], events: [],
  } as never)

  const portrait = await getPortrait('p1')

  expect(portrait?.summary).toBe('She is a maker of order.')
  expect(portrait?.facets).toHaveLength(1)
  expect(portrait?.facets?.[0].label).toBe('order at home')
})
