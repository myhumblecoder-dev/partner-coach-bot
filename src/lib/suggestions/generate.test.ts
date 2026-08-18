import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateSuggestion } from './generate'
import { prisma } from '@/lib/db'
import { generate } from '@/lib/ai'
import { getProfileContext } from '@/lib/profile/context'
import type { SuggestionKind, Audience } from '@/lib/suggestions/prompt'

vi.mock('@/lib/db', () => ({
  prisma: {
    suggestion: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/ai', () => ({
  generate: vi.fn(),
}))

vi.mock('@/lib/profile/context', () => ({
  getProfileContext: vi.fn(),
}))

// Note: @/lib/suggestions/prompt is not mocked as per instructions

describe('generateSuggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns and persists a suggestion', async () => {
    const profileId = 'profile-123'
    const kind = 'gift' as SuggestionKind
    const audience = 'for_her' as Audience
    const generatedBody = 'a picnic'

    // 1. Mock context resolving with data
    vi.mocked(getProfileContext).mockResolvedValue({
      name: 'Ada',
      likes: [],
      dislikes: [],
      jokes: [],
      dreams: [],
      recentMoods: [],
      recentEvents: [],
      pastGifts: [],
      pastTrips: [],
    })

    // 2. Mock existing suggestions (empty)
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue([])

    // 3. Mock AI generation
    vi.mocked(generate).mockResolvedValue(generatedBody)

    // 4. Mock persistence
    vi.mocked(prisma.suggestion.create).mockResolvedValue({
      id: 'sug-1',
      profileId,
      body: generatedBody,
      kind,
      audience,
      createdAt: new Date(Date.UTC(2024, 0, 1)),
    } as any)

    const result = await generateSuggestion(profileId, kind, audience)

    expect(result).toBe(generatedBody)
    expect(prisma.suggestion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        profileId,
        kind,
        audience,
        body: generatedBody,
      }),
    })
  })

  it('returns null for an unknown profile', async () => {
    const profileId = 'unknown-id'
    const kind = 'gift' as SuggestionKind
    const audience = 'for_her' as Audience

    // Mock context resolving to null
    vi.mocked(getProfileContext).mockResolvedValue(null)

    const result = await generateSuggestion(profileId, kind, audience)

    expect(result).toBeNull()
    expect(generate).not.toHaveBeenCalled()
    expect(prisma.suggestion.create).not.toHaveBeenCalled()
  })
})
