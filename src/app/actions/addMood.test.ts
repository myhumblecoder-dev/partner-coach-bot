import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addMood } from './addMood'
import { prisma as db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

vi.mock('@/lib/db', () => ({
  prisma: {
    mood: {
      create: vi.fn(),
    },
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('addMood', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates the mood and revalidates', async () => {
    vi.mocked(db.mood.create).mockResolvedValue({} as any)

    const result = await addMood('p1', 'happy', null)

    expect(result).toEqual({ ok: true })
    expect(db.mood.create).toHaveBeenCalledWith({
      data: {
        profileId: 'p1',
        label: 'happy',
        note: null,
      },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/portrait')
  })

  it('empty label is rejected without a db call', async () => {
    const result = await addMood('p1', '   ', null)

    expect(result).toEqual({ ok: false })
    expect(db.mood.create).not.toHaveBeenCalled()
  })

  it('label is trimmed', async () => {
    vi.mocked(db.mood.create).mockResolvedValue({} as any)

    await addMood('p1', '  calm ', 'after dinner')

    expect(db.mood.create).toHaveBeenCalledWith({
      data: {
        profileId: 'p1',
        label: 'calm',
        note: 'after dinner',
      },
    })
  })
})
