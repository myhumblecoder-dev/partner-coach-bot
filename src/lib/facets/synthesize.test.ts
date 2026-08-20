import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { generate } from '@/lib/ai'
import { synthesizeSection } from './synthesize'

vi.mock('@/lib/db', () => ({
  prisma: {
    profile: { findUnique: vi.fn() },
    facet: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    likesEntry: { findMany: vi.fn(), update: vi.fn() },
    dislikesEntry: { findMany: vi.fn(), update: vi.fn() },
    joke: { findMany: vi.fn(), update: vi.fn() },
    dream: { findMany: vi.fn(), update: vi.fn() },
    trip: { findMany: vi.fn(), update: vi.fn() },
  },
}))
vi.mock('@/lib/ai', () => ({ generate: vi.fn() }))
// prompt and parse are pure local modules — never mocked.

describe('synthesizeSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(
      { id: 'p1', name: 'Yoyo' } as never)
    vi.mocked(prisma.facet.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.facet.update).mockResolvedValue({} as never)
    vi.mocked(prisma.likesEntry.update).mockResolvedValue({} as never)
  })

  it('creates a facet and assigns its observations', async () => {
    vi.mocked(prisma.likesEntry.findMany).mockResolvedValue([
      { id: 'l1', text: 'cleanliness' },
      { id: 'l2', text: 'orderliness' },
    ] as never)
    vi.mocked(generate).mockResolvedValue(
      '{"assignments": [{"label": "order at home", "observations": [0, 1]}]}')
    vi.mocked(prisma.facet.create).mockResolvedValue({ id: 'f9' } as never)

    await expect(synthesizeSection('p1', 'likes')).resolves.toBe(2)

    expect(prisma.facet.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ label: 'order at home', evidenceCount: 2 }),
      }))
    expect(prisma.likesEntry.update).toHaveBeenCalledTimes(2)
    expect(prisma.likesEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { facetId: 'f9' } }))
  })

  it('reinforces an existing facet', async () => {
    vi.mocked(prisma.facet.findMany).mockResolvedValue(
      [{ id: 'f1', label: 'order at home', status: 'active' }] as never)
    vi.mocked(prisma.likesEntry.findMany).mockResolvedValue(
      [{ id: 'l3', text: 'a tidy kitchen' }] as never)
    vi.mocked(generate).mockResolvedValue(
      '{"assignments": [{"facetId": "f1", "observations": [0]}]}')

    await expect(synthesizeSection('p1', 'likes')).resolves.toBe(1)

    expect(prisma.facet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'f1' },
        data: expect.objectContaining({ evidenceCount: { increment: 1 } }),
      }))
  })

  it('an unknown facet id is skipped', async () => {
    vi.mocked(prisma.likesEntry.findMany).mockResolvedValue(
      [{ id: 'l1', text: 'tea' }] as never)
    vi.mocked(generate).mockResolvedValue(
      '{"assignments": [{"facetId": "f404", "observations": [0]}]}')

    await expect(synthesizeSection('p1', 'likes')).resolves.toBe(0)
    expect(prisma.facet.update).not.toHaveBeenCalled()
    expect(prisma.likesEntry.update).not.toHaveBeenCalled()
  })

  it('nothing unassigned means no model call', async () => {
    vi.mocked(prisma.likesEntry.findMany).mockResolvedValue([] as never)

    await expect(synthesizeSection('p1', 'likes')).resolves.toBe(0)
    expect(generate).not.toHaveBeenCalled()
  })
})
