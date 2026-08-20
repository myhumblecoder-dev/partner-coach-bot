import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addEntry, type EntryField } from './addEntry'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

vi.mock('@/lib/db', () => ({
  prisma: {
    likesEntry: { create: vi.fn() },
    dislikesEntry: { create: vi.fn() },
    joke: { create: vi.fn() },
    dream: { create: vi.fn() },
    gift: { create: vi.fn() },
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('addEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a like', async () => {
    const res = await addEntry('p1', 'likes', 'tea')
    
    expect(res).toEqual({ ok: true })
      expect(prisma.likesEntry.create).toHaveBeenCalledWith({
      data: { profileId: 'p1', text: 'tea' },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/portrait')
  })

  it('a dream stores description', async () => {
    const res = await addEntry('p1', 'dreams', 'a cabin')

    expect(res).toEqual({ ok: true })
    expect(prisma.dream.create).toHaveBeenCalledWith({
      data: { profileId: 'p1', description: 'a cabin' },
    })
    expect(prisma.likesEntry.create).not.toHaveBeenCalled()
  })

  it('unknown field is rejected', async () => {
    // @ts-expect-error - testing runtime rejection of invalid field
    const res = await addEntry('p1', 'moods', 'x')

    expect(res).toEqual({ ok: false })
    expect(prisma.likesEntry.create).not.toHaveBeenCalled()
    expect(prisma.dislikesEntry.create).not.toHaveBeenCalled()
    expect(prisma.joke.create).not.toHaveBeenCalled()
    expect(prisma.dream.create).not.toHaveBeenCalled()
  })

  it('empty text is rejected', async () => {
    const res = await addEntry('p1', 'likes', '  ')

    expect(res).toEqual({ ok: false })
    expect(prisma.likesEntry.create).not.toHaveBeenCalled()
  })
})

it('a gift stores description', async () => {
  vi.clearAllMocks()
  vi.mocked(prisma.gift.create).mockResolvedValue({} as never)

  const result = await addEntry('p1', 'gifts', 'a pottery wheel')

  expect(result).toEqual({ ok: true })
  expect(prisma.gift.create).toHaveBeenCalledWith({
    data: { profileId: 'p1', description: 'a pottery wheel' },
  })
})
