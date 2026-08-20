import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { addOccasion } from './addOccasion'

vi.mock('@/lib/db', () => ({ prisma: { occasion: { create: vi.fn() } } }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

describe('addOccasion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.occasion.create).mockResolvedValue({} as never)
  })

  it('creates an occasion and revalidates', async () => {
    const result = await addOccasion('p1', 'birthday', 'her birthday', 9, 4)

    expect(result).toEqual({ ok: true })
    expect(prisma.occasion.create).toHaveBeenCalledWith({
      data: { profileId: 'p1', kind: 'birthday', label: 'her birthday', month: 9, day: 4 },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/portrait')
  })

  it('rejects an impossible date without a db call', async () => {
    expect(await addOccasion('p1', 'birthday', 'x', 13, 4)).toEqual({ ok: false })
    expect(await addOccasion('p1', 'birthday', 'x', 2, 31)).toEqual({ ok: false })
    expect(prisma.occasion.create).not.toHaveBeenCalled()
  })

  it('rejects an empty label', async () => {
    expect(await addOccasion('p1', 'anniversary', '  ', 6, 12)).toEqual({ ok: false })
    expect(prisma.occasion.create).not.toHaveBeenCalled()
  })
})
