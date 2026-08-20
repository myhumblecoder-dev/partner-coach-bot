import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { generate } from '@/lib/ai'
import { composePortraitSummary } from './summary'

vi.mock('@/lib/db', () => ({
  prisma: {
    profile: { findUnique: vi.fn(), update: vi.fn() },
    facet: { findMany: vi.fn() },
  },
}))
vi.mock('@/lib/ai', () => ({ generate: vi.fn() }))

const FACETS = [
  { section: 'likes', label: 'order at home', status: 'active' },
  { section: 'likes', label: 'japanese food', status: 'active' },
  { section: 'dislikes', label: 'surprises', status: 'active' },
]

describe('composePortraitSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(
      { id: 'p1', name: 'Yoyo' } as never)
    vi.mocked(prisma.profile.update).mockResolvedValue({} as never)
  })

  it('composes and stores from active facets', async () => {
    vi.mocked(prisma.facet.findMany).mockResolvedValue(FACETS as never)
    vi.mocked(generate).mockResolvedValue('She is a maker of order.')

    await expect(composePortraitSummary('p1')).resolves.toBe(
      'She is a maker of order.')

    expect(prisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          portraitSummary: 'She is a maker of order.',
        }),
      }))
  })

  it('too few facets means no call and no write', async () => {
    vi.mocked(prisma.facet.findMany).mockResolvedValue(FACETS.slice(0, 2) as never)

    await expect(composePortraitSummary('p1')).resolves.toBeNull()
    expect(generate).not.toHaveBeenCalled()
    expect(prisma.profile.update).not.toHaveBeenCalled()
  })

  it('a model failure writes nothing', async () => {
    vi.mocked(prisma.facet.findMany).mockResolvedValue(FACETS as never)
    vi.mocked(generate).mockRejectedValue(new Error('down'))

    await expect(composePortraitSummary('p1')).resolves.toBeNull()
    expect(prisma.profile.update).not.toHaveBeenCalled()
  })
})
