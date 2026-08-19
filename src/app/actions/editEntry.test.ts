import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { updateEntry, deleteEntry } from './editEntry'

vi.mock('@/lib/db', () => ({
  prisma: {
    likesEntry: { update: vi.fn(), delete: vi.fn() },
    dislikesEntry: { update: vi.fn(), delete: vi.fn() },
    joke: { update: vi.fn(), delete: vi.fn() },
    dream: { update: vi.fn(), delete: vi.fn() },
    trip: { update: vi.fn(), delete: vi.fn() },
  },
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const MODELS = () => [
  prisma.likesEntry, prisma.dislikesEntry, prisma.joke, prisma.dream, prisma.trip,
]

describe('editEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const m of MODELS()) {
      vi.mocked(m.update).mockResolvedValue({} as never)
      vi.mocked(m.delete).mockResolvedValue({} as never)
    }
  })

  it("updates a dream's description", async () => {
    const result = await updateEntry('dreams', 'd1', 'a bigger cabin')

    expect(result).toEqual({ ok: true })
    expect(prisma.dream.update).toHaveBeenCalledWith({
      where: { id: 'd1' },
      data: { description: 'a bigger cabin' },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/portrait')
  })

  it('deletes a like', async () => {
    const result = await deleteEntry('likes', 'l1')

    expect(result).toEqual({ ok: true })
    expect(prisma.likesEntry.delete).toHaveBeenCalledWith({ where: { id: 'l1' } })
  })

  it('unknown field is rejected without a db call', async () => {
    expect(await updateEntry('moods' as never, 'x', 'y')).toEqual({ ok: false })
    expect(await deleteEntry('moods' as never, 'x')).toEqual({ ok: false })
    for (const m of MODELS()) {
      expect(m.update).not.toHaveBeenCalled()
      expect(m.delete).not.toHaveBeenCalled()
    }
  })

  it('a failed delete reports not-ok', async () => {
    vi.mocked(prisma.joke.delete).mockRejectedValue(new Error('gone'))

    expect(await deleteEntry('jokes', 'j1')).toEqual({ ok: false })
  })
})
