import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { rateGift } from './rateGift'

vi.mock('@/lib/db', () => ({ prisma: { gift: { update: vi.fn() } } }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

describe('rateGift', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.gift.update).mockResolvedValue({} as never)
  })

  it('rates a gift as landed', async () => {
    const result = await rateGift('g1', 'hit')

    expect(result).toEqual({ ok: true })
    expect(prisma.gift.update).toHaveBeenCalledWith({
      where: { id: 'g1' },
      data: { howItLanded: 'hit' },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/portrait')
  })

  it('rejects an unknown outcome', async () => {
    expect(await rateGift('g1', 'meh' as never)).toEqual({ ok: false })
    expect(prisma.gift.update).not.toHaveBeenCalled()
  })
})
