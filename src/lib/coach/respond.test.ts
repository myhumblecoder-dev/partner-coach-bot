import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { generate } from '@/lib/ai'
import { getProfileContext, type ProfileContext } from '@/lib/profile/context'
import { extractFacts } from '@/lib/extraction/extract'
import { respond } from './respond'

vi.mock('@/lib/db', () => ({
  prisma: {
    message: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))
vi.mock('@/lib/ai', () => ({ generate: vi.fn() }))
vi.mock('@/lib/profile/context', () => ({ getProfileContext: vi.fn() }))
vi.mock('@/lib/extraction/extract', () => ({ extractFacts: vi.fn() }))

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

describe('respond', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getProfileContext).mockResolvedValue(base)
    vi.mocked(prisma.message.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.message.create).mockResolvedValue({} as never)
    vi.mocked(generate).mockResolvedValue('a thoughtful reply')
    vi.mocked(extractFacts).mockResolvedValue(0)
  })

  it('returns the generated reply', async () => {
    await expect(respond('p1', 'hi')).resolves.toBe('a thoughtful reply')
  })

  it('persists both turns', async () => {
    await respond('p1', 'hi')

    expect(prisma.message.create).toHaveBeenCalledTimes(2)
    expect(prisma.message.create).toHaveBeenCalledWith({
      data: { profileId: 'p1', role: 'user', text: 'hi' },
    })
    expect(prisma.message.create).toHaveBeenCalledWith({
      data: { profileId: 'p1', role: 'assistant', text: 'a thoughtful reply' },
    })
  })

  it('handles a missing profile', async () => {
    vi.mocked(getCC).mockResolvedValue(null)

    const reply = await respond('p1', 'hi')

    expect(reply).toContain('profile')
    expect(generate).not.toHaveBeenCalled()
    expect(extractFacts).not.toHaveBeenCalled()
  })

  it('passes recent history to the prompt', async () => {
    vi.mocked(prisma.message.findMany).mockResolvedValue([
      { role: 'assistant', text: 'second' },
      { role: 'user', text: 'first' },
    ] as never)

    await respond('p1', 'and now?')

    expect(generate).toHaveBeenCalledOnce()
    expect(generate).toHaveBeenCalledWith(expect.stringContaining('first'))
    expect(generate).toHaveBeenCalledWith(expect.stringContaining('second'))
    // findMany returns newest-first; the prompt must read chronologically.
    const prompt = vi.mocked(generate).mock.lastCall?.[0] ?? ''
    expect(prompt.indexOf('first')).toBeLessThan(prompt.indexOf('second'))
  })

  it('extracts from the user message', async () => {
    const profileId = 'p1'
    const userMessage = 'she loved the thai place'
    await respond(profileId, userMessage)

    expect(extractFacts).toHaveBeenCalledWith(profileId, userMessage)
  })

  it('extraction failure does not break the reply', async () => {
    vi.mocked(extractFacts).mockRejectedValue(new Error('extraction failed'))

    const reply = await respond('p1', 'hi')

    expect(reply).toBe('a thoughtful reply')
  })

  it('no extraction without a profile', async () => {
    vi.mocked(getProfileContext).mockResolvedValue(null)

    await respond('p1', 'hi')

    expect(extractFacts).not.toHaveBeenCalled()
  })
})

// Helper to avoid type errors in the mock setup if needed
const getCC = getProfileContext
