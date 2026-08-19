import { describe, it, expect, vi, beforeEach } from 'vitest'
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
})
